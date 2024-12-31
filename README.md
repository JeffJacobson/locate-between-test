# locate-between-test

Given a Route ID, direction, and begin and end <abbr title='State Route MilePost'>SRMP</abbr> values, calculates the segment of that route between the two mileposts.

## How it works

1. Query the [mileposts map service layer] to find the point features matching the input. This will give you the corresponding <abbr title='Accumulated Route Mileage'>ARM</abbr> values. The ARM values are the actual measures.
2. Using the ARM values, query the LRS routes service layer to get the polyline geometry for that entire route.
3. Use the [locateBetweenOperator] to find the route segment between the ARM values on the route geometry.

[locateBetweenOperator]:https://developers.arcgis.com/javascript/latest/api-reference/esri-geometry-operators-locateBetweenOperator.html
[mileposts map service layer]:https://data.wsdot.wa.gov/arcgis/rest/services/Shared/AllStateRoutePoints/MapServer/0/