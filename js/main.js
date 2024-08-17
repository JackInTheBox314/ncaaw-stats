document.addEventListener('DOMContentLoaded', function() {
    d3.csv('ncaaw_players_2023-2024.csv').then(function(data) {
        let svg = ''
        let players = []
        for (var i = 0; i < data.length; i++) {
            for (const col of Object.keys(data[i]).slice(5)) {
                data[i][col] = parseFloat(data[i][col])
            }
            let player = data[i]
            players.push(data[i]['NAME'])
            player['Offensive Impact'] = ((player['PTS'] + player['AST'] * 2) / player['MIN']) * (player['FG%'] * 0.5 + player['3P%'] * 0.25 + player['FT%'] * 0.25) - player['TO'] / player['MIN']
            player['Defensive Impact'] = (player['STL'] + player['BLK'] + 0.5 * player['REB']) / player['MIN']
            player['AST/TO Ratio'] = player['AST'] / (player['TO'] + 1)
            player['Scoring Threat'] = (player['FG%'] * 0.3 + player['3P%'] * 0.3 + player['FT%'] * 0.2) * (player['FGM'] * 0.3 + player['3PM'] * 0.3 + player['FTM'] * 0.2)
            player['Reliability'] = (player['MIN'] / 40) * (player['FG%'] * player['PTS']) + (player['STL'] + player['BLK']) * 2
            player['TS%'] = player['PTS'] / (2 * (player['FGA'] + 0.44 * player['FTA']))
            
        }

        const data_copy = JSON.parse(JSON.stringify(data))
        console.log(JSON.parse(JSON.stringify(data)))

        let features = ['PTS', 'REB', 'BLK', 'STL', 'AST/TO Ratio', 'AST', '3PM', 'TS%']
        console.log(features)
        console.log(players)
    
        let max_stats = []
        for (const feature of features) {
            let max_stat = Math.max(...data.map(o => o[feature]))
            for (var j = 0; j < data.length; j++) {
                let row = data[j]
                row[feature] = row[feature] * 10 / max_stat
            }
        }

        const getPercentile = (arr, val, field) => {
            const sorted = arr.slice().sort((a, b) => b[field] - a[field]);
            console.log(sorted)
            const rank = sorted.findIndex(obj => obj['NAME'] === val);
            return (1 - (rank / (arr.length-1))) * 10;
        }
        console.log(getPercentile(data_copy, 'Kaylee Krysztof', 'REB'))

    
        const container = document.createElement('div')
        container.id = 'dropdown-container'
    
        const first_player_dropdown = document.createElement('select')
        first_player_dropdown.id = 'dropdown1'
        const second_player_dropdown = document.createElement('select')
        second_player_dropdown.id = 'dropdown2'
        document.body.appendChild(container)
        container.appendChild(first_player_dropdown)
        container.appendChild(second_player_dropdown)
        for (const player of players) {
            const player_option = document.createElement('option')
            player_option.value = player
            player_option.textContent = player
            first_player_dropdown.appendChild(player_option)
        }
        for (const player of players) {
            const player_option = document.createElement('option')
            player_option.value = player
            player_option.textContent = player
            second_player_dropdown.appendChild(player_option)
        }
    
        first_player_dropdown.addEventListener('change', handle_change)
        second_player_dropdown.addEventListener('change', handle_change)
    
    
        function handle_change() {
            player_data = []
            let player1 = first_player_dropdown.value
            let player2 = second_player_dropdown.value
            player_data.push(data.find((obj) => obj.NAME === player1))
            player_data.push(data.find((obj) => obj.NAME === player2))
            create_chart(player_data, features)
        }
    
    
        let player1 = first_player_dropdown.value
        let player2 = second_player_dropdown.value
        player_data = []
        player_data.push(data.find((obj) => obj.NAME === player1))
        player_data.push(data.find((obj) => obj.NAME === player2))
    
        const create_chart = (data, features) => {
    
            if (svg !== '') {
                document.body.removeChild(document.body.lastChild)
            }
    
            let players = data.map(({ NAME }) => (Object.values({ NAME }))).flat(1);
    
            data = data.map(obj =>
                Object.keys(obj).filter(key =>
                    features.includes(key)).reduce((newObj, key) =>
                    {
                        newObj[key] = obj[key];
                        return newObj;
                    }, {}
                )
            )
    
        
            
    
            let width = 500;
            let height = 500;
            svg = d3.select("body").append("svg")
                .attr("width", width)
                .attr("height", height);
    
    
            let radialScale = d3.scaleLinear()
                .domain([0, 10])
                .range([0, 150]);
            let ticks = [2, 4, 6, 8, 10];
    
    
            svg.selectAll("circle")
                .data(ticks)
                .join(
                    enter => enter.append("circle")
                        .attr("cx", width / 2)
                        .attr("cy", height / 2)
                        .attr("fill", "none")
                        .attr("stroke", "#ccc")
                        .attr("r", d => radialScale(d))
                );
    
            function angleToCoordinate(angle, value){
                let x = Math.cos(angle) * radialScale(value);
                let y = Math.sin(angle) * radialScale(value);
                return {"x": width / 2 + x, "y": height / 2 - y};
            }
    
            let featureData = features.map((f, i) => {
                let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
                return {
                    "name": f,
                    "angle": angle,
                    "line_coord": angleToCoordinate(angle, 10),
                    "label_coord": angleToCoordinate(angle, 10.5)
                };
            });
            
            // draw axis line
            svg.selectAll("line")
                .data(featureData)
                .join(
                    enter => enter.append("line")
                        .attr("x1", width / 2)
                        .attr("y1", height / 2)
                        .attr("x2", d => d.line_coord.x)
                        .attr("y2", d => d.line_coord.y)
                        .attr("stroke","#ccc")
                );
            
            // draw axis label
            svg.selectAll(".axislabel")
                .data(featureData)
                .join(
                    enter => enter.append("text")
                        .attr("x", d => d.label_coord.x)
                        .attr("y", d => d.label_coord.y)
                        .text(d => d.name)
                );
            
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", 50)
                .text(players);
    
            let line = d3.line()
                .x(d => d.x)
                .y(d => d.y);
            let colors = ["rgb(54, 162, 235", "rgb(255, 99, 132"];
    
            function getPathCoordinates(data_point){
                let coordinates = [];
                for (var i = 0; i < features.length; i++){
                    let ft_name = features[i];
                    let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
                    coordinates.push(angleToCoordinate(angle, data_point[ft_name]));
                }
                coordinates.push(angleToCoordinate(Math.PI / 2, data_point[features[0]]));
                return coordinates;
            }
    
            svg.selectAll("path")
                .data(data)
                .join(
                    enter => enter.append("path")
                        .datum(d => getPathCoordinates(d))
                        .attr("d", line)
                        .attr("stroke", (_, i) => colors[i] + ')')
                        .attr("fill", (_, i) => colors[i] + ', 0.2)')
                        .attr("fill-opacity", 0.6)
                );
        }
    
        create_chart(player_data, features)
    
    })
})