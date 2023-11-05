
export function init2DScene() {
    let canvas = document.getElementById("myCanvas2D");
    let ctx = canvas.getContext("2d");

    // Define the center and base radius of the main circle
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let baseRadius = 0.22 * canvas.height;
    let baseRadiusSmaller = 0.025 * canvas.height;

    const drawCircle = (x, y, radius) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#FF0000";
        ctx.fill();
        ctx.closePath();
    };

    const drawScene = (highlightAngle) => {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for(let i = 0; i < 12; i++) {
            let angle = i * (2 * Math.PI / 12); // Divide the circle into 12 parts
            let x = centerX + (1.5 * baseRadius) * Math.cos(angle);
            let y = centerY + (1.5 * baseRadius) * Math.sin(angle);

            // Calculate the difference between current circle angle and highlight angle
            let angleDiff = Math.abs(angle - highlightAngle);
            angleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff); // Account for wrap-around at 2π
            
            // Calculate the radius: larger if the angleDiff is smaller
            let factor = Math.cos(angleDiff);
            let radius = baseRadiusSmaller * (1 + factor); // Notice the factor change here
            
            drawCircle(x, y, radius);
        }
    };

    // Event listener for mousemove
    window.addEventListener("mousemove", (e) => {
        let rect = canvas.getBoundingClientRect();

        let centerX = rect.left + rect.width / 2;
        let centerY = rect.top + rect.height / 2;

        let dx = e.clientX - centerX;
        let dy = e.clientY - centerY;
        
        let angle = Math.atan2(dy, dx);
        drawScene(angle);
    });

    // Draw initial scene
    drawScene(0);
}
