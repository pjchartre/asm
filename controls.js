const PLAYING = true;
const PAUSED = false;
const MIN_ZOOM_LEVEL = 1;
const MAX_ZOOM_LEVEL = 5;

const VALIDATE = true;
const INVALIDATE = false;

let scenario = null;

let isPlaying = false;
let playPauseElement, fromStartElement, toEndElement, stepBackElement, stepForwardElement;
let videoElement, timeBarElement;
let videoDuration = 0;
let videoSrcIsChanging = false;
let currentRate = 1;
let currentZoomLevel = 1;
let isDragging = false, original = {x: 0, y: 0, offset: {x: 0, y: 0}};
let offset = {x: 0, y: 0};

let game = {
    tryShouldBeValidated: true
}

function togglePlayPause() {
    if (!isPlaying)
        play();
    else
        pause();
}

function play() {
    isPlaying = PLAYING;
    if (videoElement.ended) {
        rewind();
    }
    togglePlayIcon();
    playAllVideos();
}

function pause() {
    isPlaying = PAUSED;
    togglePlayIcon();
    pauseAllVideos();
}

function playAllVideos() {
    const videos = document.getElementById('main-container').querySelectorAll('video');
    [...videos].forEach(v => v.play());
}

function pauseAllVideos() {
    const videos = document.getElementById('main-container').querySelectorAll('video');
    [...videos].forEach(v => v.pause());
}

function togglePlayIcon() {
    const icon = playPauseElement.querySelector('i');
    if (isPlaying == PLAYING) {
        icon.classList.remove('bi-play');
        icon.classList.add('bi-pause');
    } else {
        icon.classList.remove('bi-pause');
        icon.classList.add('bi-play');
    }
}

function rewind() {
    const videos = document.getElementById('main-container').querySelectorAll('video');
    [...videos].forEach(v => v.currentTime = 0);
}

function forward() {
    const videos = document.getElementById('main-container').querySelectorAll('video');
    [...videos].forEach(v => {
        v.currentTime = v.duration;
        v.pause();
    });
}

function stepBack() {
    pause();
    timeBarElement.value = timeBarElement.value - 3;
    updateVideoFromPercent(timeBarElement.value);
}

function stepForward() {
    pause();
    timeBarElement.value = Number(timeBarElement.value) + 3;
    updateVideoFromPercent(timeBarElement.value);
}

function updateProgressBar(percent) {
    if (!videoSrcIsChanging) {
        document.getElementById('time-bar').value = percent;
    }
}

function reloadVideoMetaData() {
    videoDuration = videoElement.duration;
    videoElement.ontimeupdate = () => {
        const currentTime = videoElement.currentTime;
        const percent = currentTime / videoDuration * 1000;
        updateProgressBar(percent);
    }
    videoElement.onended = () => {
        pause();
    };
}

function goToVideoTime(videoTime, elem) {
    elem.currentTime = videoTime;
}

function updateVideoFromPercent(value) {
    const videos = document.getElementById('main-container').querySelectorAll('video');
    [...videos].forEach(v => {
        const videoTime = value / 1000 * v.duration;
        goToVideoTime(videoTime, v);
    });

}

function updateVideoSrc(src) {
    videoSrcIsChanging = true;
    const currentPercentage = videoElement.currentTime / videoElement.duration;
    videoElement.src = src;
    const newPercentage = +currentPercentage.toFixed(4);
    bindDurationChangeEventToVideo(newPercentage);
}

function bindClickEventToVideos() {
    const videosElements = document.getElementById('right-panel').querySelectorAll('video');
    [...videosElements].forEach(v => {
        v.onclick = () => updateVideoSrc(v.src);
    })
}

function bindDurationChangeEventToVideo(newPercentage) {
    videoElement.ondurationchange = () => {
        reloadVideoMetaData();
        if (newPercentage != null) {
            videoElement.currentTime = newPercentage * videoElement.duration;
            videoSrcIsChanging = false;
            if (isPlaying == PLAYING) {
                videoElement.play();
            }
        }
        videoElement.playbackRate = currentRate;
    }
}

function bindClickEventToRates() {
    const ratesElements = document.getElementById('rate-container').querySelectorAll('.button');
    [...ratesElements].forEach(b => {
        b.onclick = clickRate;
    })
}

function updateVideosRates(rate) {
    currentRate = rate;
    const videosElements = document.getElementById('main-container').querySelectorAll('video');
    [...videosElements].forEach(v => {
        v.playbackRate = rate;
    })
}

function clickRate(event) {
    let selectedRate = event.target.innerText;
    selectedRate = selectedRate.substring(1, selectedRate.length);
    updateVideosRates(selectedRate);
    const ratesElements = document.getElementById('rate-container').querySelectorAll('.button');
    [...ratesElements].forEach(b => {
        b.classList.remove('selected');
    })
    event.target.classList.add('selected');
}

function bindClickEventToZoomButtons() {
    document.getElementById('zoom-in-button').onclick = zoomIn;
    document.getElementById('zoom-out-button').onclick = zoomOut;
}

function zoomIn() {
    currentZoomLevel = Math.min(currentZoomLevel + 1, MAX_ZOOM_LEVEL);
    updateZoomLevel();
}

function zoomOut() {
    currentZoomLevel = Math.max(currentZoomLevel - 1, MIN_ZOOM_LEVEL);
    updateZoomLevel();
}

function updateZoomLevel() {
    const zoomElement = document.getElementById('zoom-video-container');
    zoomElement.classList.remove(...zoomElement.classList);
    zoomElement.classList.add(`scale-${currentZoomLevel}x`);
}


function bindMouseEventToVideoContainer() {
    const videoContainerElement = document.getElementById('zoom-video-container');

    videoContainerElement.onmousedown = (event) => {
        isDragging = true;
        const containerElement = document.getElementById('video-container');
        const rect = containerElement.getBoundingClientRect();
        original.x = event.layerX - rect.left;
        original.y = event.layerY - rect.top;
    };

    videoContainerElement.onmousemove = (event) => {
        if (isDragging) {
            const containerElement = document.getElementById('video-container');
            const videoElement = containerElement.querySelector('video');
            const rect = containerElement.getBoundingClientRect();

            const currentX = event.layerX - rect.left;
            const currentY = event.layerY - rect.top;
            offset.x = currentX - original.x + original.offset.x;
            offset.y = currentY - original.y + original.offset.y;
            videoElement.style = `transform: translate(${offset.x}px, ${offset.y}px)`;
        }
    }
    videoContainerElement.onmouseup = (event) => {
        isDragging = false;
        original.offset.x = offset.x;
        original.offset.y = offset.y;
    }

}

function showScenarioChooser() {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('scenario-chooser').classList.remove('hidden');
}

function displayDecisionOverlay() {
    const overlayElement = document.getElementById('decision-overlay');
    overlayElement.classList.remove(...overlayElement.classList);
    overlayElement.classList.add('visible', 'step1');
}

function closeDecisionOverlay() {
    const overlayElement = document.getElementById('decision-overlay');
    overlayElement.classList.remove(...overlayElement.classList);
    document.getElementById('decision-overlay').querySelectorAll('video').forEach(e => {
        e.pause();
        e.currentTime = 0;
    });
}

function makeDecision(validated) {
    let message = 'Bonne réponse';
    let classMessage = 'good-answer';
    if (game.tryShouldBeValidated != validated) {
        message = 'Mauvaise réponse';
        classMessage = 'wrong-answer';
    }

    let validatedMessage = 'l\'essai est valide ! 🏉';
    if (!game.tryShouldBeValidated) {
        validatedMessage = 'l\'essai n\'est pas valide ! ❌';
    }
    const finalMessage = `${message}, ${validatedMessage}`;
    const answerMessageElement = document.getElementById('answer-message');
    answerMessageElement.innerText = finalMessage;
    answerMessageElement.classList.remove(...answerMessageElement.classList);
    answerMessageElement.classList.add(classMessage);
    const overlayElement = document.getElementById('decision-overlay');
    overlayElement.classList.remove('step1');
    overlayElement.classList.add('step2');
}

function selectedScenario(s) {
    console.log('selectedScenario', s);
    scenario = s;
    document.querySelector("#zoom-video-container video").setAttribute('src', s.videos[0]);

    const videoElements = document.querySelectorAll("#right-panel video");
    for(let i = 0; i < videoElements.length; i++){
        videoElements[i].setAttribute('src', s.videos[i]);
    }



    document.getElementById('scenario-chooser').classList.add('hidden');
    document.getElementById('main-container').classList.remove('hidden');
}

window.addEventListener('scenario-selected', (event) => {
    console.log('listener event', event);
    selectedScenario(event.detail.scenario);
});

window.addEventListener('load', (event) => {
    videoElement = document.getElementById('video-container').querySelector('video');
    playPauseElement = document.getElementById('play-pause-button');
    fromStartElement = document.getElementById('from-start-button');
    toEndElement = document.getElementById('to-end-button');
    stepBackElement = document.getElementById('step-back-button');
    stepForwardElement = document.getElementById('step-forward-button');
    timeBarElement = document.getElementById('time-bar');

    playPauseElement.onclick = togglePlayPause;
    fromStartElement.onclick = rewind;
    toEndElement.onclick = forward;
    stepBackElement.onclick = stepBack;
    stepForwardElement.onclick = stepForward;

    bindDurationChangeEventToVideo();
    bindClickEventToVideos();
    bindClickEventToRates();
    bindClickEventToZoomButtons();
    bindMouseEventToVideoContainer();

    reloadVideoMetaData();
    timeBarElement.value = 0;
    timeBarElement.addEventListener('input', function () {
        updateVideoFromPercent(timeBarElement.value)
    }, false);

    document.getElementById('splash-screen').onclick = showScenarioChooser;
    document.getElementById('decision-button').onclick = displayDecisionOverlay;
    document.getElementById('close-button').onclick = closeDecisionOverlay;
    document.getElementById('validate-button').onclick = () => makeDecision(VALIDATE);
    document.getElementById('invalidate-button').onclick = () => makeDecision(INVALIDATE);
});
