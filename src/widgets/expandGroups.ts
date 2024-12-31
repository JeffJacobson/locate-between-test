import type MapView from "@arcgis/core/views/MapView";
import type SceneView from "@arcgis/core/views/SceneView";
import type View from "@arcgis/core/views/View";
import type BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import type Expand from "@arcgis/core/widgets/Expand";
import type LayerList from "@arcgis/core/widgets/LayerList";
import type ListItem from "@arcgis/core/widgets/LayerList/ListItem";
import type ListItemPanel from "@arcgis/core/widgets/LayerList/ListItemPanel";
import type Widget from "@arcgis/core/widgets/Widget";

/**
 * Valid UI position strings.
 * Equivalent to...
 * ```typescript
 * `${"top" | "bottom"}-${"leading" | "trailing" | "left" | "right"}` | "manual";
 * ```
 * ...but defined in this way so we don't have to modify the code
 * in the event that Esri adds additional supported values.
 */
export type UIPosition = Required<
  Pick<__esri.UIAddPosition, "position">
>["position"];

export const uiPositionRe =
  /^(?:(?:manual)|(?:(?:top)|(?:bottom))-(?:(?:left)|(?:right)|(?:leading)|(?:trailing)))$/;

type ExpandProperties = NonNullable<ConstructorParameters<typeof Expand>[0]>;

/**
 * Determines if the input string is a valid {@link UIPosition}.
 * @param input
 * @returns
 */
export const isValidUIPosition = (input: unknown): input is UIPosition =>
  typeof input === "string" && uiPositionRe.test(input);

/**
 * Creates a new object and copies the properties of the input object
 * to the new one.
 * @param options - An input object.
 * @returns Returns a new object with the same properties as the input one
 */
function copyObjectProperties<T>(options: T) {
  const currentOptions: Record<PropertyKey, unknown> = {};
  for (const propertyName in options) {
    if (Object.prototype.hasOwnProperty.call(options, propertyName)) {
      const element = options[propertyName];
      currentOptions[propertyName] = element;
    }
  }
  return currentOptions as T;
}

type ViewAddOptions = NonNullable<Parameters<typeof View.prototype.ui.add>[1]>;

/**
 *
 * Sets up a group of {@link Expand} elements containing the input {@link Widget}.
 * @param view - view
 * @param viewAddOptions - View add options
 * @param expandOptions - expandOptions
 * @param widgets - widgets
 * @returns The array of {@link Expand} objects that were created to contain the {@link widgets}.
 * @throws - Throws a {@link TypeError} if {@link widgets} contains no elements or if no group was specified.
 */
export async function setupExpandGroup(
  view: View,
  viewAddOptions: ViewAddOptions,
  expandOptions?: ExpandProperties,
  ...widgets: Widget[]
) {
  console.group(setupExpandGroup.name);
  console.debug(`${setupExpandGroup.name} constructor`, {
    view,
    viewAddOptions,
    expandOptions,
    widgets,
  });
  try {
    // Throw error if no widgets were specified.
    if (widgets.length < 1) {
      throw new TypeError("No widgets were specified.");
    }

    // Import the Expand module.
    const Expand = (await import("@arcgis/core/widgets/Expand")).default;

    // Create expand options if not already specified.
    if (!expandOptions) {
      console.debug(
        "expandOptions was null or undefined. Creating new object.",
      );
      expandOptions = {};
      console.debug({ expandOptions });
    }

    // If view add options is just the UIPosition, convert to object
    // with its position property set to the original string.
    viewAddOptions = isValidUIPosition(viewAddOptions)
      ? { position: viewAddOptions }
      : (viewAddOptions as __esri.UIAddPosition);

    // If no group has been defined for the Expand,
    // use the position string as the group name.
    if (!expandOptions.group) {
      expandOptions.group = viewAddOptions.position as string;
    }
    if (!expandOptions.group) {
      const message =
        "There was no group specified. Expands will not be grouped";
      console.error(message);
      throw new TypeError(message);
    }

    // Create an Expand for each of the widgets.
    const expands = widgets.map((widget, index) => {
      const currentOptions = expandOptions
        ? copyObjectProperties(expandOptions)
        : {};

      currentOptions.content = widget;
      console.debug(`Expand constructor options`, currentOptions);
      const expand = new Expand(currentOptions);
      return {
        component: expand,
        index: index + 1,
        position: currentOptions.group,
      } as __esri.UIAddComponent;
    });

    console.debug("expand objects", expands);

    // Add the newly-created Expands to the view.
    view.ui.add(expands, viewAddOptions);

    return expands;
  } finally {
    console.groupEnd();
  }
}

type LayerListItemCreateEvent = {
  item: ListItem;
};

function hasListItem(event: unknown): event is LayerListItemCreateEvent {
  return !!event && Object.hasOwn(event, "item");
}

/**
 * Performs further setup tasks on a layer list item, such as adding a legend.
 * @param param0 - Layer list item creation event object,
 * which contains an "item" ListItem property.
 */
const setupLayerListItems: __esri.LayerListListItemCreatedHandler = (event) => {
  if (!hasListItem(event)) {
    throw new TypeError(
      `Expected event object to have an item property with a ListItem value`,
    );
  }
  // Add a legend to the list item panel
  event.item.panel = {
    content: "legend",
  } as ListItemPanel;
};

type LayerListOptions = NonNullable<ConstructorParameters<typeof LayerList>[0]>;

async function setupLayerList(
  properties: LayerListOptions & Required<Pick<LayerListOptions, "view">>,
) {
  const LayerList = (await import("@arcgis/core/widgets/LayerList")).default;

  properties.listItemCreatedFunction = setupLayerListItems;
  properties.visibleElements = {
    errors: true,
    statusIndicators: true,
  };

  const layerList = new LayerList(properties);
  return layerList;
}

async function setupBasemapGallery(
  ...[properties]: ConstructorParameters<typeof BasemapGallery>
) {
  const BasemapGallery = (await import("@arcgis/core/widgets/BasemapGallery"))
    .default;

  const gallery = new BasemapGallery(properties);
  return gallery;
}

type ExpandGroupSetupParams = Parameters<typeof setupExpandGroup>;

export async function setupWidgets(
  view: MapView | SceneView,
  viewAddOptions: ExpandGroupSetupParams[1],
  expandOptions: ExpandGroupSetupParams[2],
) {
  console.group(setupWidgets.name);
  console.debug(`${setupWidgets.name} constructor`, {
    view,
    viewAddOptions,
    expandOptions,
  });
  try {
    const [gallery, layerList] = await Promise.all([
      setupBasemapGallery({
        view,
        source: {
          portal: {
            url: "https://wsdot.maps.arcgis.com",
          },
        },
      }),
      setupLayerList({
        view,
      }),
    ]);

    void setupExpandGroup(
      view,
      viewAddOptions,
      expandOptions,
      gallery,
      layerList,
    );
  } finally {
    console.groupEnd();
  }
}
