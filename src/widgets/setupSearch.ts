import type MapView from "@arcgis/core/views/MapView";
import type SceneView from "@arcgis/core/views/SceneView";

async function getSearchSources() {
  const { default: LocatorSearchSource } = await import(
    "@arcgis/core/widgets/Search/LocatorSearchSource"
  );

  const waLocationSearchSource = new LocatorSearchSource({
    // Use the WSDOT Customized view of the Geocoder
    url: "https://utility.arcgis.com/usrsvcs/servers/a86fa8aeabdd470792022a8ef959afb6/rest/services/World/GeocodeServer",
    name: "ArcGIS World Geocode Service",
    locationType: "street",
    // Probably don't need to specify US since an extent is already specified in the view
    // that the URL points to, but shouldn't harm anything.
    countryCode: "US",
    suggestionsEnabled: true,
    // Show a graphic for the location, zoom to it, and open its popup.
    popupEnabled: true,
    autoNavigate: true,
    resultGraphicEnabled: true,
    placeholder: "Find address or place",
    singleLineFieldName: "SingleLine",
  });

  return [waLocationSearchSource];
}

/**
 * Dynamically imports the "Search" widget module and creates a Search widget.
 * @returns A Search widget.
 */
export async function setupSearch(view: MapView | SceneView) {
  const Search = await import("@arcgis/core/widgets/Search").then(
    (i) => i.default,
  );

  const search = new Search({
    view,
    includeDefaultSources: false,
    sources: await getSearchSources(),
  });
  return search;
}

export default setupSearch;
