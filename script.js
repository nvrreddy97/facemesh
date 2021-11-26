const controls = window;
const drawingUtils = window;
const mpFaceMesh = window;
const config = { locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@`+
        `${mpFaceMesh.VERSION}/${file}`;
    } };

// Our input frames will come from here.
const videoCanvasElement = document.getElementsByClassName('videocanvas')[0];
const frameCanvasElement = document.getElementsByClassName('framecanvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = videoCanvasElement.getContext('2d');
const frameCanvasCtx = frameCanvasElement.getContext('2d');

/**
 * Solution options.
 */
const solutionOptions = {
    selfieMode: true,
    enableFaceGeometry: false,
    maxNumFaces: 1,
    refineLandmarks: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
};

// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};

function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, videoCanvasElement.width, videoCanvasElement.height);

    // To show the webcams streaming frame
    canvasCtx.drawImage(results.image, 0, 0, videoCanvasElement.width, videoCanvasElement.height);

    if (results.multiFaceLandmarks) {
        // To draw a frame arround the facemesh landmarks.
        drawFrame(frameCanvasCtx, videoCanvasElement.width, videoCanvasElement.height, results.multiFaceLandmarks, '#4c8d5b', '#4c8d5b');
    }

    canvasCtx.restore();
}

const faceMesh = new mpFaceMesh.FaceMesh(config);
faceMesh.setOptions(solutionOptions);
faceMesh.onResults(onResults);

// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, solutionOptions)
    .add([
    new controls.SourcePicker({
        onFrame: async (input, size) => {
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            videoCanvasElement.width = width;
            videoCanvasElement.height = height;
            frameCanvasElement.width = width;
            frameCanvasElement.height = height;
            await faceMesh.send({ image: input });
        },
    })
]);

// FaceMesh indexes
const overheadIndex = 10;
const chinIndex = 152;
const leftCheekIndex = 454;
const rightCheekIndex = 234;

// Canvas constants
const opacity = 0.9;
const backgroundColor = '#3c3d91';
const radius = 90;
const frameLineWidth = 10;
const dotOffset = 4;

// function to draw a frame 
function drawFrame(ctx, canvasWidth, canvasHeight, facePredictions, mainBorderColor, dottedBorderColor)
{
    if (facePredictions.length > 0) {
        for (let x = 0; x < facePredictions.length; x++) {
            const keypoints = facePredictions[x];  //468 key points of face;
            ctx.globalAlpha = opacity;
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0,0, canvasWidth, canvasHeight);

            let xCoordinate = (canvasWidth * keypoints[rightCheekIndex].x - canvasWidth * 0.05) ;
            let yCoordinate = (canvasHeight * keypoints[overheadIndex].y - canvasHeight * 0.2);
            let frameWidth = (canvasWidth * keypoints[leftCheekIndex].x) - (canvasWidth * keypoints[rightCheekIndex].x);
            let adjustedFrameWidth = frameWidth + frameWidth*0.4;
            let frameHeight = (canvasHeight * keypoints[chinIndex].y) - (canvasHeight * keypoints[overheadIndex].y);
            let adjustedFrameHeight = frameHeight + frameHeight*0.6;

            // To cut the transparent background
            roundRect(ctx, xCoordinate-frameLineWidth , yCoordinate-frameLineWidth, adjustedFrameWidth+2*frameLineWidth, adjustedFrameHeight+2*frameLineWidth, radius);
            ctx.clip();
            ctx.clearRect( xCoordinate-frameLineWidth , yCoordinate-frameLineWidth, adjustedFrameWidth+2*frameLineWidth, adjustedFrameHeight+2*frameLineWidth);
            
            // To draw main frame
            ctx.strokeStyle = mainBorderColor;
            ctx.lineWidth = frameLineWidth;
            roundRect(ctx, xCoordinate, yCoordinate , adjustedFrameWidth , adjustedFrameHeight, radius);
            ctx.stroke();

            // To draw dotted frame
            ctx.lineWidth = frameLineWidth;
            ctx.setLineDash([dotOffset, dotOffset]);
            ctx.strokeStyle = dottedBorderColor;
            roundRect(ctx, xCoordinate-frameLineWidth/2, yCoordinate-frameLineWidth/2, adjustedFrameWidth+frameLineWidth, adjustedFrameHeight+frameLineWidth, radius);
            ctx.stroke();
        }
    }
}

// Function to draw a rounded rectagle on canvas.
function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
  }