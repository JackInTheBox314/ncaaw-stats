from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd

headers = {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246"
}

driver = webdriver.Chrome()
url = "https://www.espn.com/nba/stats/player"
driver.get(url)

# display all entries
try:
    while True:
        button = WebDriverWait(driver, 20).until(EC.element_to_be_clickable((By.CLASS_NAME, "loadMore__link")))
        button.click()
except:
    print('finished')

soup = BeautifulSoup(driver.page_source, 'html.parser')

tables = soup.findAll('tbody', attrs={'class': 'Table__TBODY'})
players_teams = tables[0].findAll('div', attrs={'class': 'athleteCell__flag flex items-start mr7'})
all_stats = tables[1].findAll('tr', attrs={'class': 'Table__TR Table__TR--sm Table__even'})

fields = ['Position', 'Games Played', 'Minutes Per Game', 'Points Per Game', 'Average Field Goals Made', 'Average Field Goals Attempted', 'Field Goal Percentage', 'Average 3-Point Field Goals Made', 'Average 3-Point Field Goals Attempted', '3-Point Field Goal Percentage', 'Average Free Throws Made', 'Average Free Throws Attempted', 'Free Throws Percentage', 'Rebounds Per Game', 'Assists Per Game', 'Steals Per Game', 'Blocks Per Game', 'Turnovers Per Game']

fields_abb = ['POS', 'GP', 'MIN', 'PTS', 'FGM', 'FGA', 'FG%', '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'REB', 'AST', 'STL', 'BLK', 'TO', 'DD2', 'TD3']

table = []
for i, player_team in enumerate(players_teams):
    row = {}
    
    rank = i + 1
    player = player_team.find('a').text
    team = player_team.find('span').text
    
    row['RANK'] = rank
    row['NAME'] = player
    row['TEAM'] = team
    
    stats = all_stats[i].findAll('td', attrs={'class': 'Table__TD'})
    # print(stats)
    for j, stat in enumerate(stats):
        # print(j, stat)
        stats[j] = stat.text
        row[fields_abb[j]] = stats[j]
    # print(stats)
    print(player_team.find('a')['data-player-uid'].index('~a:'))
    id = player_team.find('a')['data-player-uid'][player_team.find('a')['data-player-uid'].index('~a:') + 3:]
    team_img = player_team.find('img')['src']
    player_img = "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/" + id + ".png&w=350&h=254"
    
    # print(id)
    # print(team_img)
    # print(player_img)
    
    row['id'] = id
    row['team_img'] = team_img
    row['player_img'] = player_img
    
    table.append(row)
# print(table)
df = pd.DataFrame(table)
print(df)

df.to_csv('nba_players_2023-2024.csv')
