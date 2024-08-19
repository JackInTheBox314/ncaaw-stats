document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(evt){
        console.log(evt.clientX, evt.clientY)
    })
    d3.csv('ncaaw_players_2023-2024.csv').then(function(data) {
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

        // let features = ['PTS', 'REB', 'BLK', 'STL', 'AST/TO Ratio', 'AST', '3PM', 'TS%']
        let features = ['Offensive Impact', 'Defensive Impact', 'AST/TO Ratio', 'Scoring Threat', 'Reliability']
        console.log(features)
        console.log(players)


        const getPercentile = (arr, val, field) => {
            const sorted = arr.slice().sort((a, b) => b[field] - a[field]);
            console.log(sorted)
            const rank = sorted.findIndex(obj => obj['NAME'] === val);
            return (1-(rank / (arr.length-1))) * 100;
        }
        console.log(getPercentile(data_copy, 'Caitlin Clark', 'AST'))
    
        const first_player_dropdown = document.querySelector('#player1')
        const second_player_dropdown = document.querySelector('#player2')
        
        for (const player of players) {
            const player_option = document.createElement('option')
            player_option.value = player
            player_option.textContent = player
            first_player_dropdown.appendChild(player_option)
        }
        for (const player of players) {
            const player_option = document.createElement('option')
            player_option.value = player
            if (player === 'JuJu Watkins') {
                player_option.selected = 'selected'
            }
            player_option.textContent = player
            second_player_dropdown.appendChild(player_option)
        }

        const percentile_checkbox = document.querySelector('#percentile')
        percentile_checkbox.addEventListener('change', handle_change)
    
        first_player_dropdown.addEventListener('change', handle_change)
        second_player_dropdown.addEventListener('change', handle_change)

        let player1 = first_player_dropdown.value
        let player2 = second_player_dropdown.value
    
    
        function handle_change() {
            player1 = first_player_dropdown.value
            player2 = second_player_dropdown.value
            player_data = set_data(player1, player2)
            console.log(player_data)
            create_chart(player_data, features)
        }

        function set_data(player1, player2) {
            let temp_data = []
            
            temp_data.push(data.find((obj) => obj.NAME === player1))
            temp_data.push(data.find((obj) => obj.NAME === player2))

            let new_data = temp_data.map(obj =>
                features.reduce((newObj, key) => {
                    if (obj.hasOwnProperty(key)) {
                        newObj[key] = obj[key];
                    }
                    return newObj;
                }, {})
            )
            console.log('new_data', JSON.parse(JSON.stringify(new_data)))

            if (percentile_checkbox.checked) {
                let row1 = new_data[0]
                let row2 = new_data[1]
                for (const feature of features) {
                    row1[feature] = getPercentile(data, player1, feature)
                    row2[feature] = getPercentile(data, player2, feature)
                }
            } else {
                for (const feature of features) {
                    let max_stat = Math.max(...data.map(o => o[feature]))
                    for (var j = 0; j < 2; j++) {
                        let row = new_data[j]
                        row[feature] = row[feature] * 100 / max_stat
                    }
                }
            }


            return new_data
        }

        player_data = set_data(player1, player2)

        console.log(player_data[0])
        console.log(Object.entries(player_data[0]))
    
        const create_chart = (player_data, features) => {

            let canvas = document.getElementById('myChart');

            let ctx = canvas.getContext('2d');

            if (canvas.chart_instance) {
                canvas.chart_instance.destroy()
            }

            const gradientBlue = ctx.createRadialGradient(290, 360, 0, 290, 360, 230);
            gradientBlue.addColorStop(0, 'rgba(135, 135, 255, 0.5)');
            gradientBlue.addColorStop(1, 'rgba(85, 85, 255, 0.7)');
      

            const gradientRed = ctx.createRadialGradient(290, 360, 0, 290, 360, 230);
            gradientRed.addColorStop(0, 'rgba(255, 135, 135, 0.5)');
            gradientRed.addColorStop(1, 'rgba(255, 85, 85, 0.7)');


            const config = {
                type: 'radar',
                data: {
                labels: features,
                datasets: [{
                    label: player1,
                    data: Object.values(player_data[0]),
                    fill: true,
                    backgroundColor: gradientBlue,
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(85, 85, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)',
                    pointHitRadius: 50,
                  }, {
                    label: player2,
                    data: Object.values(player_data[1]),
                    fill: true,
                    backgroundColor: gradientRed,
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(255, 85, 184)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)',
                    pointHitRadius: 50,
                  }]
                },
                options: {
                    interaction: {
                        mode: 'index',
                        intersect: true,
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'NCAAW Players Comparison',
                            font: {
                                size: 30,
                            }
                        }
                    },
                    elements: {
                      line: {
                        borderWidth: 0,
                      }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0,
                            suggestedMax: 100,
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                padding: 10,
                                callback: function(value, index) {
                                    return index % 2 === 0 ? value + '%' : '';
                                },
                            },
                        }
                    },
                    responsive:true,
                    animation: {
                        duration: 500,
                    },
                },
            }

            canvas.chart_instance = new Chart(ctx, config);
        }
    
        create_chart(player_data, features) 
    })
})