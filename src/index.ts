import express from "express"
import config from "../config.toml"
import fs from "fs"
import log from "npmlog"
import { assemble_leaderboard, type Leaderboard } from "./leaderboard"

const app = express()

let leaderboard: Leaderboard | null = null
let last_refetch: number = 0

app.use(express.static("src/web"))

app.get("/leaderboard.json", async (req, res) => {
    if (Date.now() > last_refetch + config.boatlabs.refetch_speed) {
        last_refetch = Date.now()
        leaderboard = await assemble_leaderboard()
    }

    res.send(leaderboard)
})

const logWriteStream = fs.createWriteStream("leaderboard.log")
if (process.env.NODE_ENV == "dev") log.level = "verbose"

log.on("log", (log: any) => {
    logWriteStream.write(
        `[${new Date().toISOString()}] ${
            log.prefix
        } ${log.level.toUpperCase()} ${log.message}` + "\n"
    )
})

app.listen(config.webserver.port, () => {
    log.info("WEB", `Listening on ${config.webserver.port}`)
})

