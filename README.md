# Impact chart widget
The impact chart widget shows for a selected set of sectors the LCIA results
of these sectors in comparison to each other where a bar chart is generated
for each LCIA category.

![](./images/impact_chart.png)

It is based on [D3](https://d3js.org/) as its only dependency. Here is
a complete example regarding its usage:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Impact chart example</title>
</head>
<body>
    <div id="impact-chart" style="margin: auto; width: 80%">
    </div>
</body>
<script src="lib/d3.min.js"></script>
<script src="ImpactChart.js"></script>
<script>
    var chart = USEEIO.ImpactChart.on({
        selector: '#impact-chart',
        endpoint: 'http://localhost/api',
        model: 'USEEIO',
    });
    chart.update(['1111A0', '111200', '111400', '112120']);
</script>
</html>
```

The function `USEEIO.ImpactChart.on` creates an instance of an impact chart
and attaches it to an HTML element. It takes a configuration object with the
following fields:

* `selector: string`: the selector of the HTML element (e.g. the ID of a `div`
  element),
* `endpoint: string`: the endpoint of an [USEEIO API]() instance
* `apikey: string` (optional): an API key
* `model: string`: the ID of the USEEIO model to use
* `width: number` (optional, default `500`): the width of the chart in pixels
* `height: number` (optional, default `500`): the height of the chart in pixels
* `columns: number` (optional, default `2`): the number of columns in which the
  bar charts are organized
* `responsive: boolean` (optional, experimental): creates a responsive chart







```ts
var chart = USEEIO.ImpactChart.on({
    div: 'impact-chart',
    endpoint: 'https://api.edap-cluster.com/useeio/api',
    model: 'USEEIOv1.2',
    apikey: 'lySopVteG11Ru0m5ucnRharYBWco1CIGWlxKvro0',
});
chart.update(['1111A0', '111200', '111400', '112120']);
```

```ts
 const sectors = await this.getSectors(sectorCodes);
        if (!sectors) {
            return;
        }
        const indicators = await this.getIndicators(indicatorCodes);
        if (!indicators) {
            return;
        }
        const result = await this.getResult(sectors, indicators);

        const width = 800;
        const height = 800;

        for (let i = 0; i < indicators.length; i++) {
            const rowOff = (height / indicators.length) * i;
            this.svg.append("text")
                .attr("x", 10)
                .attr("y", rowOff + 25)
                .style("font", "italic 16px serif")
                .text(indicators[i].name);
                
            // <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
            for (let j = 0; j < sectors.length; j++) {
                const colOff = (width / sectors.length) * j;
                this.svg.append("circle")
                    .attr("cx", colOff + 25)
                    .attr("cy", rowOff + 25)
                    .attr("r", 40 * result.get(i, j))
                    .attr("stroke", "black")
                    .attr("fill", "black")
            }
        }
```

```
// chart grid
            for (let k = 0; k < 5; k++) {
                const x = cellOffsetX + 5 + k * (cellWidth - 10) / 5;
                this.svg.append("line")
                    .attr("x1", x)
                    .attr("x2", x)
                    .attr("y1", cellOffsetY + cellHeaderHeight)
                    .attr("y2", cellOffsetY + cellChartHeight )
                    .style("stroke-width", 1)
                    .style("stroke", "#e8eaf6");
            }
```