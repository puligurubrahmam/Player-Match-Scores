const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let db = null
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server Running At http://localhost/3000/')
    })
  } catch (e) {
    console.log(`Error Occured:${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

function convertDBObjectToResponseObject(dbObject) {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
//Returns a list of all the players in the player table

app.get('/players/', async (request, response) => {
  const sqlquery = `
    SELECT * FROM PLAYER_DETAILS
    ORDER BY PLAYER_ID;
    `
  const playersArray = await db.all(sqlquery)
  response.send(
    playersArray.map(eachItem => convertDBObjectToResponseObject(eachItem)),
  )
})

//Returns a specific player based on the player ID

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const sqlquery = `
  SELECT * FROM PLAYER_DETAILS
  WHERE PLAYER_ID=${playerId};
  `
  const player = await db.get(sqlquery)
  response.send(convertDBObjectToResponseObject(player))
})

//Updates the details of a specific player based on the player ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const sqlquery = `
  UPDATE PLAYER_DETAILS 
  SET 
  PLAYER_NAME='${playerName}'
  WHERE PLAYER_ID=${playerId};
  `
  await db.run(sqlquery)
  response.send('Player Details Updated')
})

//Returns the match details of a specific match

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const sqlquery = `
  SELECT * FROM MATCH_DETAILS
  WHERE MATCH_ID=${matchId}
  `
  const match = await db.get(sqlquery)
  response.send({matchId: match.match_id, match: match.match, year: match.year})
})

//Returns a list of all the matches of a player

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const sqlquery = `
  SELECT PLAYER_MATCH_SCORE.MATCH_ID AS matchId,
  MATCH AS match,
  YEAR AS year
  FROM PLAYER_MATCH_SCORE JOIN MATCH_DETAILS
  ON PLAYER_MATCH_SCORE.MATCH_ID=MATCH_DETAILS.MATCH_ID
  WHERE PLAYER_ID=${playerId}
  ORDER BY PLAYER_MATCH_SCORE.MATCH_ID;
  `
  const matches = await db.all(sqlquery)
  response.send(matches)
})

//Returns a list of players of a specific match

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const sqlquery = `
  SELECT player_details.PLAYER_ID AS playerId,
  PLAYER_NAME AS playerName
  FROM PLAYER_MATCH_SCORE JOIN PLAYER_DETAILS ON
  PLAYER_MATCH_SCORE.PLAYER_ID=PLAYER_DETAILS.PLAYER_ID
  WHERE PLAYER_MATCH_SCORE.MATCH_ID=${matchId};
  `
  const players = await db.all(sqlquery)
  response.send(players)
})

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const sqlquery = `
  SELECT PLAYER_DETAILS.PLAYER_ID AS playerId,
  PLAYER_NAME AS playerName,
  sum(score) AS totalScore,
  sum(fours) AS totalFours,
  sum(sixes) AS totalSixes
  FROM PLAYER_MATCH_SCORE JOIN PLAYER_DETAILS ON
  PLAYER_MATCH_SCORE.PLAYER_ID=PLAYER_DETAILS.PLAYER_ID 
  WHERE PLAYER_DETAILS.PLAYER_ID=${playerId};
  `
  const statistics = await db.get(sqlquery)
  response.send(statistics)
})
module.exports = app
