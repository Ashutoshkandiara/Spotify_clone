console.log("let's write some javascript");
let currentSong = new Audio();
let songs;
let currfolder;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder) {
  currfolder = folder.endsWith('/') ? folder : folder + '/';
  let a = await fetch(`http://127.0.0.1:3000/${currfolder}`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`${currfolder}`)[1]);
    }
  }
  let songUL = document.querySelector(".Songlist").getElementsByTagName("ul")[0];
  songUL.innerHTML = "";  // Clear the list before appending
  for (const song of songs) {
    songUL.innerHTML += ` <li>
              <img class="invert musicimg" src="music.svg" alt="">
              <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
              </div>
              <div class="playnow">
                <span>Play now</span>
                <img class="invert" src="play.svg" alt="">
              </div>
            </li>`;
  }

  // Attach element listener to each song
  Array.from(document.querySelector(".Songlist").getElementsByTagName("li")).forEach(e => {
    e.addEventListener("click", () => {
      const songName = e.querySelector(".info").firstElementChild.innerHTML.trim();
      console.log("Selected song:", songName);  // Debugging line
      playMusic(songName);
    });
  });

  return songs;
}

const playMusic = (track, pause = false) => {
  track = track.startsWith('/') ? track.slice(1) : track;  // Ensure no leading slash
  currentSong.src = `${currfolder}${track}`;
  console.log(`Playing: ${currentSong.src}`);  // Debugging line
  if (!pause) {
    currentSong.play();
    document.getElementById("play").src = "pause.svg";  // Updated line
  }

  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00/00:00";
};

async function display() {
  let a = await fetch(`http://127.0.0.1:3000/songs/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let cardcontainer = document.querySelector(".cardcontainer");
  let anchors = div.getElementsByTagName("a");
  let array = Array.from(anchors);

  for (let index = 0; index < array.length; index++) {
    const element = array[index];

    if (element.href.includes("/songs")) {
      let folder = element.href.split("/").slice(-2)[0];
      
      // get meta data of the folder
      let b = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
      let folderInfo = await b.json();
      cardcontainer.innerHTML += `
        <div data-folder="${folder}" class="card">
          <div class="play">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
              <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z" fill="#000000" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </div>
          <img src="songs/${folder}/cover.jpg" alt="">
          <h4>${folderInfo.title}</h4>
          <p>${folderInfo.description}</p>
        </div>`;
    }
  }

  // Attach event listeners to cards
  Array.from(document.getElementsByClassName("card")).forEach(e => {
    e.addEventListener("click", async (item) => {
      await getsongs(`songs/${item.currentTarget.dataset.folder}`);
      
        playMusic(songs[0]);
    });
    
  });
}

// show all the songs in the playlist
async function main() {
  // Remember autoplay policy
  await getsongs("songs/cs");
  console.log("Fetched songs:", songs);  // Debugging line
  if (songs.length > 0) {
    playMusic(songs[0], true);
  } else {
    console.log("No songs found.");
  }

  // Display all the albums on the page
  await display();

  // Listen for time update event
  currentSong.addEventListener("timeupdate", () => {
    console.log("Time update:", currentSong.currentTime, currentSong.duration);  // Debugging line
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Event listener for seekbar
  document.querySelector(".seekbar").addEventListener("click", e => {
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");
    const percent = (e.offsetX / seekbar.getBoundingClientRect().width) * 100;
    circle.style.left = percent + "%";
    currentSong.currentTime = ((currentSong.duration) * percent) / 100;
  });

  // Add an event listener for hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  // Add an event listener for close button
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Add event listeners to previous and next buttons
  document.getElementById("previous").addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").splice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  document.getElementById("next").addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").splice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Attach event listener to play button
  document.getElementById("play").addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      document.getElementById("play").src = "pause.svg";
    } else {
      currentSong.pause();
      document.getElementById("play").src = "play.svg";
    }
  });

  // Add event to volume control
  document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
  });

  //Add event listener to mute the track
  document.querySelector(".volume>img").addEventListener("click", e => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
    }
  });
  
}

main();
