const list = document.getElementById("list")

let t = ""

list.innerHTML = `loading :D`

fetch("leaderboard.json").then(response => {
        list.innerHTML = `<tr>
        <tH class="pos">pos</td>
        <tH class="name">name</td>
        <tH class="points">points</td>
    </tr>`
    response.json().then(data => {
        for (let i = 0; i < data.length; i++) {
            const ranking = data[i];

            let style = ""

            switch (i) {
                case 0:
                    style = "color: gold;";
                    break
                case 1:
                    style = "color: silver;";
                    break
                case 2:
                    style = "color: darkorange;";
                    break
            }

            list.innerHTML += `<tr style="${style}">
    <td class="pos">${i + 1}</td>
    <td class="name">${ranking.name}</td>
    <td class="points">${ranking.points.toLocaleString()}</td>
</tr>\n`
        }
    }).catch(console.log)
}).catch(console.log)