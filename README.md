# WSDOT Linear Referencing using only a Feature Service

Given a Route ID, direction, and begin and end <abbr title='State Route MilePost'>SRMP</abbr> values, calculates the segment of that route between the two mileposts.

## How it works

1. User inputs:
   - Route ID
   - Route direction
     - "i" for increase
     - "d" for decrease
   - begin SRMP + ahead/back indicator ("A" or "B")
   - end SRMP + ahead/back indicator ("A" or "B")
2. [Query feature service] to get:
   - All mileposts features that match the input Route ID, direction, and begin and end SRMP + ahead/back indicator values.
      This will give you the corresponding <abbr title='Accumulated Route Mileage'>ARM</abbr> values. The ARM values are the actual measures in miles.
   - All LRS route features that match the input Route ID and direction.
3. Using the ARM values from the returned milepost features as measures, use the [locateBetweenOperator] to find the route segment between the ARM values on the route geometry.

## TO DO

- [ ] Add tests
- [ ] Deterime if the ARMs need to be converted from miles to another measurement unit corresponding with current spatial reference system.

[locateBetweenOperator]:https://developers.arcgis.com/javascript/latest/api-reference/esri-geometry-operators-locateBetweenOperator.html
[Query feature service]:https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service/
