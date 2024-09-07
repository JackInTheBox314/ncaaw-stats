document.addEventListener('DOMContentLoaded', function() {
    d3.csv('ncaaw_players_2023-2024(v2).csv').then(function(data) {
        let players = []
        for (var i = 0; i < data.length; i++) {
            for (const col of Object.keys(data[i]).slice(5, 21)) {
                data[i][col] = parseFloat(data[i][col])
            }
            let player = data[i]
            players.push(data[i]['NAME'])
            player['Offensive Impact'] = ((player['PTS'] + player['AST'] * 2) / player['MIN']) * (player['FG%'] * 0.5 + player['3P%'] * 0.25 + player['FT%'] * 0.25) - player['TO'] / player['MIN']
            player['Defensive Impact'] = (player['STL'] + player['BLK'] + 0.5 * player['REB']) / player['MIN']
            player['Playmaking Ability'] = player['AST'] / (player['TO'] + 1)
            player['Scoring Threat'] = (player['FG%'] * 0.3 + player['3P%'] * 0.3 + player['FT%'] * 0.2) * (player['FGM'] * 0.3 + player['3PM'] * 0.3 + player['FTM'] * 0.2)
            player['Reliability'] = (player['MIN'] / 40) * (player['FG%'] * player['PTS']) + (player['STL'] + player['BLK']) * 2
            player['TS%'] = player['PTS'] / (2 * (player['FGA'] + 0.44 * player['FTA']))
            player['AST / TO'] = Math.round((player['AST'] / player['TO']) * 10) / 10
            player['EFG%'] = Math.round(((player['FGM'] + 0.5 * player['3PM']) * 100 / player['FGA']) * 10) / 10
        }

        const original_data = JSON.parse(JSON.stringify(data))

        // let features = ['PTS', 'REB', 'BLK', 'STL', 'AST/TO Ratio', 'AST', '3PM', 'TS%']
        let features = ['Offensive Impact', 'Defensive Impact', 'Playmaking Ability', 'Scoring Threat', 'Reliability']
        console.log(features)


        const getPercentile = (arr, val, field) => {
            const sorted = arr.slice().sort((a, b) => b[field] - a[field]);
            const rank = sorted.findIndex(obj => obj['NAME'] === val);
            return (1-(rank / (arr.length-1))) * 100;
        }    
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

        const suggested_comparisons = document.querySelector('#suggested-comparisons')
        console.log(suggested_comparisons)
        for (const suggested_comparison of suggested_comparisons.children) {
            suggested_comparison.addEventListener('click', function(){
                const matchup = suggested_comparison.textContent;
                player1 = matchup.slice(0, matchup.indexOf(' vs. '))
                player2 = matchup.slice(matchup.indexOf(' vs. ') + 5)
                console.log(player1)
                console.log(player2)
                first_player_dropdown.value = player1
                second_player_dropdown.value = player2
                handle_change(player1, player2)
            })
        }

        const explanation_img = document.querySelector('#explanation')
        const explanation = document.querySelector('#explanation-bubble')
        explanation_img.addEventListener('mouseover', function(){
            explanation.style.opacity = '100'
        })
        explanation_img.addEventListener('mouseout', function(){
            explanation.style.opacity = '0'
        })

        const percentile_checkbox = document.querySelector('#percentile')
        percentile_checkbox.addEventListener('change', handle_change)
    
        first_player_dropdown.addEventListener('change', handle_change)
        second_player_dropdown.addEventListener('change', handle_change)

        let player1 = first_player_dropdown.value
        let player2 = second_player_dropdown.value
        let both_players = [player1, player2]
    
        function handle_change(evt) {
            player1 = first_player_dropdown.value
            player2 = second_player_dropdown.value
            both_players = [player1, player2]
            players_data = set_data(player1, player2)
            console.log(evt.target)
            console.log(percentile_checkbox)
            create_chart(players_data, features)
            if (evt.target !== percentile_checkbox) {
                console.log('triggered')
                fill_info(players_data, features)
            }
        }

        function set_data(player1, player2) {

            for (const suggested_comparison of suggested_comparisons.children) {
                let match_up = suggested_comparison.textContent;
                let player_1 = match_up.slice(0, match_up.indexOf(' vs. '))
                let player_2 = match_up.slice(match_up.indexOf(' vs. ') + 5)
                if ((player1 === player_1 && player2 === player_2) || (player1 === player_2 && player2 === player_1)) {
                    suggested_comparison.className = "checked";
                } else {
                    suggested_comparison.className = "";
                }
            }

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

            console.log(new_data)
            return new_data
        }

        players_data = set_data(player1, player2)

        const player_info_containers = document.querySelectorAll('.player-info-container')
    
        const fill_info = (players_data, features) => {
            const stat_comparisons_container = document.querySelector('#stat-comparisons-container')
            if (stat_comparisons_container.hasChildNodes) {
                stat_comparisons_container.replaceChildren()
            }
            for (let i = 0; i < players_data.length; i++) {
                let player_info_container = player_info_containers[i]
                player_info_container.querySelector('#info-name').textContent = both_players[i]
                let player_image_div = player_info_container.querySelector('.player-img')
                let info_team_img = player_info_container.querySelector('#info-team').querySelector('img')
                let info_team_span = player_info_container.querySelector('#info-team').querySelector('span')
                let info_pos_div = player_info_container.querySelector('#info-position')
                player_image_div.src = data.find(x => x.NAME === both_players[i])['player_img']
                info_team_img.src = data.find(x => x.NAME === both_players[i])['team_img']
                info_team_span.textContent = '• ' + data.find(x => x.NAME === both_players[i])['TEAM']
                let pos = data.find(x => x.NAME === both_players[i])['POS']
                if (pos === 'G'){
                    pos = 'Guard'
                } else if (pos === 'F') {
                    pos = 'Forward'
                } else if (pos === 'C') {
                    pos = 'Center'
                }
                info_pos_div.textContent = pos
            }
            for (const feature of features) {
                let feature_container = document.createElement('div')
                feature_container.id = 'feature-container'
                feature_container.appendChild(document.createElement('h3')).textContent = feature
                stat_comparisons_container.appendChild(feature_container)
                feature_container.appendChild(document.createElement('hr'))
                let stats_to_compare = []
                if (feature === 'Offensive Impact') {
                    stats_to_compare = ['PTS', 'AST', 'EFG%']
                } else if (feature === 'Defensive Impact') {
                    stats_to_compare = ['STL', 'BLK', 'REB']
                } else if (feature === 'Playmaking Ability') {
                    stats_to_compare = ['AST / TO']
                } else if (feature === 'Scoring Threat') {
                    stats_to_compare = ['FG%', '3P%', 'FT%']
                } else if (feature === 'Reliability') {
                    stats_to_compare = ['MIN']
                }
                for (const stat of stats_to_compare) {
                    let stat_row_container = document.createElement('div')
                    stat_row_container.id = 'stat-row-container'
                    let stat_name_container = document.createElement('div')
                    stat_name_container.textContent = stat
                    if (stat === 'PTS') {
                        stat_name_container.textContent = 'Points'
                    } else if (stat === 'AST') {
                        stat_name_container.textContent = 'Assists'
                    } else if (stat === 'FG%') {
                        stat_name_container.textContent = 'Field Goal %'
                    } else if (stat === 'STL') {
                        stat_name_container.textContent = 'Steals'
                    } else if (stat === 'BLK') {
                        stat_name_container.textContent = 'Blocks'
                    } else if (stat === 'REB') {
                        stat_name_container.textContent = 'Rebounds'
                    } else if (stat === '3P%') {
                        stat_name_container.textContent = 'Three-Point %'
                    } else if (stat === 'FT%') {
                        stat_name_container.textContent = 'Free-Throw %'
                    } else if (stat === 'MIN') {
                        stat_name_container.textContent = 'Minutes Played'
                    } else if (stat === 'EFG%') {
                        stat_name_container.textContent = 'Effective Field Goal %'
                    }
                    stat_name_container.id = 'stat-name-container'
                    stat_row_container.appendChild(stat_name_container)
                    let stat_values = []
                    for (let i = 0; i < players_data.length; i++) {
                        let player_stat_container = document.createElement('div')
                        player_stat_container.id = 'player-stat-container'
                        let stat_value = data.find(x => x.NAME === both_players[i])[stat];
                        stat_values.push(stat_value)
                        player_stat_container.textContent = stat_value
                        if (i === 0) {
                            stat_row_container.insertBefore(player_stat_container, stat_name_container)
                        } else {
                            stat_row_container.appendChild(player_stat_container)
                        }
                    }
                    if (stat_values[0] > stat_values[1]) {
                        stat_row_container.firstChild.className = 'winner'
                    } else if (stat_values[1] > stat_values[0]){
                        stat_row_container.lastChild.className = 'winner'
                    } else {
                        stat_row_container.firstChild.className = 'tied'
                        stat_row_container.lastChild.className = 'tied'
                    }
                    feature_container.appendChild(stat_row_container)

                }
            }
        }

        const create_chart = (players_data, features) => {

            let canvas = document.getElementById('myChart');
            let ctx = canvas.getContext('2d');
            if (canvas.chart_instance) {
                canvas.chart_instance.destroy()
            }

            const gradientBlue = ctx.createRadialGradient(318.8, 365.5, 0, 318.8, 365.5, 230);
            gradientBlue.addColorStop(0, 'rgba(135, 135, 255, 0.3)');
            gradientBlue.addColorStop(1, 'rgba(85, 85, 255, 0.5)');
      

            const gradientRed = ctx.createRadialGradient(318.8, 365.5, 0, 318.8, 365.5, 230);
            gradientRed.addColorStop(0, 'rgba(255, 135, 135, 0.3)');
            gradientRed.addColorStop(1, 'rgba(255, 85, 85, 0.5)');

            const data = {
                labels: features,
                datasets: [{
                    label: player1,
                    data: Object.values(players_data[0]),
                    fill: true,
                    backgroundColor: gradientBlue,
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgba(85, 85, 255, 0.5)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)',
                    pointHitRadius: 50,
                }, {
                    label: player2,
                    data: Object.values(players_data[1]),
                    fill: true,
                    backgroundColor: gradientRed,
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgba(255, 85, 85, 0.5)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)',
                    pointHitRadius: 50,
                }]
            }

            const config = {
                type: 'radar',
                data: data,
                options: {
                    layout: {
                        autoPadding: false,
                        padding: {
                            top: 20,
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: true,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            maxHeight: 20,
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            titleColor: 'rgb(50, 50, 50)',
                            bodyColor: 'rgb(100, 100, 100)',
                            footerColor: 'rgb(150, 150, 150)',
                            footerFont: {weight: 'normal', style: 'italic'},
                            titleFont: {weight: 500},
                            padding: 10,
                            rtl: false,
                            callbacks: {
                                title: function(context) {
                                    const label = context[0].label;
                                    let caption = ''
                                    if (label === 'Offensive Impact') {
                                        caption = 'Ability to generate points with efficiency'
                                    } else if (label === 'Defensive Impact') {
                                        caption =  "Ability to disrupt the opponent’s offense and protect the basket"
                                    } else if (label === 'Playmaking Ability') {
                                        caption = "Ability to create efficient plays"
                                    } else if (label === 'Scoring Threat') {
                                        caption = "Versatility of a player’s shot selection"
                                    } else if (label === 'Reliability') {
                                        caption = "Team contribution by considering their court time"
                                    }
                                    return caption;
                                },
                                label: function(context) {
                                    const player = context.dataset.label
                                    if (!percentile_checkbox.checked) {
                                        return player + ': ' + Math.round(original_data.find((obj) => obj.NAME === context.dataset.label)[context.label] * 100) / 100
                                    } else {
                                        return player + ': ' + Math.round(context.raw * 100) / 100 + '%'
                                    }     
                                },
                                footer: function(context) {
                                    const label = context[0].label;
                                    let caption = ''
                                    if (label === 'Offensive Impact') {
                                        caption = "Points, Assists, Effective Field Goal%"
                                    } else if (label === 'Defensive Impact') {
                                        caption = "Steals, Blocks, Rebounds"
                                    } else if (label === 'Playmaking Ability') {
                                        caption = "Assists, Turnovers"
                                    } else if (label === 'Scoring Threat') {
                                        caption = "2-Point %, 3-Point %, Free-Throw %"
                                    } else if (label === 'Reliability') {
                                        caption = "Usage %"
                                    }
                                    return caption;
                                }
                            },
                        },
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
                    responsive: false,
                    animation: {
                        duration: 500,
                    },
                },
            }

            canvas.chart_instance = new Chart(ctx, config);
        }
        fill_info(players_data, features)
        create_chart(players_data, features)
        
    })
})