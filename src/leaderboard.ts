import config from "../config.toml"
import log from "npmlog"

const API_PATH = {
    getTracks: () => config.boatlabs.root + "/timingsystems/getTracks",
    getTrack: (track: string) => config.boatlabs.root + "/timingsystems/getTrack/" + track
}

interface TrackSpawnLocation {
    x: number
    y: number
    z: number
    yaw: number
    pitch: number
    world_name: string
}

interface TrackTag {
    name: string
    color: string
}

interface Track {
    command_name: string
    display_name: string
    type: string
    date_created: number
    id: number

    total_attempts: number
    total_finishes: number
    total_time_spent: number
    
    weight: 100

    gui_item: string

    owner: string

    spawn_location: TrackSpawnLocation

    options: string[]
    tags: TrackTag[]

}

interface Placement {
    name: string,
    time: number
}

interface RequestGetTracks {
    number: number
    tracks: Track[]
}

interface RequestGetTrack extends Track {
    top_list: Placement[]   
}

async function request(url: string): Promise<any | null> {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "'leaderboard' Bun/1.0 (Linux) micro@cloudmc.uk / @microwavedram"
        }
    }).catch(e => log.error("BOATLABSAPI", `Failed to request ${url}\n${e}`))
    
    if (!response) return null
    if (response.status != 200) {
        log.error("BOATLABSAPI", `Bad Status ${url}\n${response.text}`)
    }

    return response.json().catch(e => log.error("BOATLABSAPI", `Failed parse ${url}\n${e}\n${response.text}`))
}

export type Leaderboard = LeaderboardRecord[]
export interface LeaderboardRecord {
    name: string,
    points: number
}

export async function assemble_leaderboard(): Promise<Leaderboard> {
    const tracks_req: RequestGetTracks = await request(API_PATH.getTracks())

    const points: { [name: string]: number[] } = {}

    log.info("LEADERBOARD", `Refreshing ${tracks_req.number} tracks`)

    for await (const r_track of tracks_req.tracks) {
        const track: RequestGetTrack = await request(API_PATH.getTrack(r_track.command_name))

        if (track) {
            let first_place_time: number = (track.top_list[0] || { time: 0 }).time

            for await (const placement of track.top_list) {
                if (!(placement.name in points)) {
                    points[placement.name] = []
                }

                const score = Math.floor(1_000_000/(placement.time - first_place_time + 1000))

                points[placement.name].push(score)
            }
        }
    }
    
    const leaderboard: Leaderboard = []
    for (const [name, track_points] of Object.entries(points)) {
        leaderboard.push({
            name: name,
            points: track_points.reduce((sum, v) => sum + v)
        })
    }

    leaderboard.sort((a, b) => b.points - a.points)

    return leaderboard
}