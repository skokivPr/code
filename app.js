// HTML content for Monaco Editor
const appHtmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Glitch Text Animation</title>
  <!-- Load Tailwind CSS from CDN -->
  <script src="https://cdn.tailwindcss.com">
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono:wght@400&display=swap" rel="stylesheet">
  <!-- Load Inter font from Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    * {
      user-select: none;

    }

    /* ===== Scrollbar CSS ===== */
    /* Firefox */
    * {
      scrollbar-width: none;
      scrollbar-color: #525252 #3b3b3b;
    }

    /* Chrome, Edge, and Safari */
    *::-webkit-scrollbar {
      width: 3px;
    }

    *::-webkit-scrollbar-track {
      background: #3b3b3b;
    }

    *::-webkit-scrollbar-thumb {
      background-color: #525252;
      border-radius: 3px;
      border: 3px solid #292929;
    }

    /* Custom CSS provided by the user, integrated for the glitch effect */
    .fxbody-3 {
      background-color: transparent;
      color: #0ff;
      /* unique color */
      font-family: "Share Tech Mono", monospace;
      /* Using Inter for overall body, Courier New fallback */
      display: flex;
      justify-content: center;
      /* Center horizontally */
      align-items: center;
      /* Center vertically */
      margin: 0;
      min-height: 100vh;
      /* Ensure it takes full viewport height */
      width: 100vw;
      /* Ensure it takes full viewport width */
      overflow: hidden;
      /* Prevent horizontal scrolling */
    }

    .fxwrap-3 {
      font-size: clamp(1.5rem, 8vw, 4rem);
      /* Responsive font size */
      font-weight: bold;
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      /* Center text within its container */
      text-shadow: 0 0 2px currentColor;
      padding: 1rem;
      /* Add some padding for small screens */
      box-sizing: border-box;
      /* Include padding in the element's total width and height */
    }

    .fxzap-3 {
      text-shadow: 0 2px 4px currentColor;
    }
  </style>
</head>

<body class="bg-black">
  <!-- Main container for the glitch text animation -->
  <div class="fxbody-3">
    <!-- Div where the glitch text will be displayed -->
    <div class="fxwrap-3" id="fxtext-3">
    </div>
  </div>
  <script>
    // Constants for the glitch animation
      const FX3_TARGET_STR = "⚡Dev-Labs Edit Welcome⚡";
      const FX3_CHARSET_NAME = "tech1";
      const FX3_ANIM_DURATION = 20000; // milliseconds
      /**
      * EnergyFluxGlitch Class
      * Handles the text animation with glitch effects.
      */
      class EnergyFluxGlitch {
      /**
      * Constructor
      * @param {HTMLElement} el - The HTML element to apply the glitch animation to.
      */
      constructor(el) {
      this.el = el;
      // Define various character sets for the glitch effect
      this.charsets = {
      tech1: "!<>-_\\/[]{}—=+*^?#________",
      tech2: "!<>-_\\/[]{}—=+*^?#$%&()~",
      math: "01︎10︎101︎01︎+=-×÷",
      cryptic: "¥¤§Ω∑∆√∞≈≠≤≥",
      mixed: "あ㐀明る日¥£€$¢₽₹₿",
      alphabet: "abcdefghijklmnopqrstuvwxyz",
      matrix1: "ラドクリフマラソンわたしワタシんょンョたばこタバコとうきょうトウキョウ",
      matrix2: "日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ",
      matrix3: "字型大小女巧偉周年",
      matrix4:
      "九七二人入八力十下三千上口土夕大女子小山川五天中六円手文日月木水火犬王正出本右四左玉生田白目石立百年休先名字早気竹糸耳虫村男町花見貝赤足車学林空金雨青草音",
      emoji1: [
      "😀",
      "😁",
      "😂",
      "🤣",
      "😃",
      "😄",
      "😅",
      "😆",
      "😉",
      "😊",
      "😋",
      "😎",
      "😍",
      "😘",
      "🥰",
      "😗",
      "😙",
      "😚",
      "🤗",
      "🤔",
      "😐",
      "😑",
      "😶",
      "🙄",
      "😏",
      "😮",
      "😯",
      "😲",
      "😴",
      "🤤",
      "🤤",
      "😪",
      "😵",
      "🤯",
      "🤪",
      "🤩",
      "🥳",
      "🥺",
      "🥵",
      "🥴",
      "🥺",
      ],
      emoji2: [
      "🏠",
      "🏢",
      "🏥",
      "🏦",
      "🏨",
      "🏫",
      "🏬",
      "🏭",
      "🏯",
      "🏰",
      "🏟️",
      "🎡",
      "🎢",
      "🎠",
      "⛲",
      "🎪",
      "🗼",
      "🗽",
      "🗿",
      "🌉",
      ],
      emoji3: [
      "🍎",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🥑",
      "🍆",
      "🥕",
      "🌽",
      "🌶️",
      "🍄",
      "🌰",
      "🍞",
      ],
      };
      this.chars = this.charsets[FX3_CHARSET_NAME]; // Select the character set based on constant
      this.queue = []; // Stores animation state for each character
      this.frame = 0; // Current animation frame
      this.resolve = null; // Promise resolver for animateTo method
      this.animFrame = null; // Stores the requestAnimationFrame ID
      }
      /**
      * Animates the text from its current state to a new target string.
      * @param {string} newText - The target string to animate to.
      * @returns {Promise<void>} A promise that resolves when the animation is complete.
      */
      animateTo(newText) {
      const oldText = this.el.innerText;
      const length = Math.max(oldText.length, newText.length); // Determine max length for iteration
      return new Promise((resolve) => {
      this.resolve = resolve;
      // Populate the queue with animation details for each character
      this.queue = Array.from({ length }, (_, i) => ({
      from: oldText[i] || "", // Character to animate from (empty if new)
      to: newText[i] || "", // Character to animate to (empty if removed)
      start: (Math.random() * 40) | 0, // Random start percentage for glitch
      end: (Math.random() * 100 + 100) | 0, // Random end percentage for glitch
      }));
      this.frame = 0; // Reset frame counter
      cancelAnimationFrame(this.animFrame); // Cancel any existing animation frame
      this._tick(); // Start the animation loop
      });
      }
      /**
      * Internal method to update the animation frame.
      * This method is called repeatedly by requestAnimationFrame.
      */
      _tick() {
      // Calculate progress of the animation (0 to 1)
      const progress = this.frame / (FX3_ANIM_DURATION / 16.67); // 16.67ms per frame at 60fps
      let out = ""; // The HTML string to render
      let done = 0; // Counter for completed characters
      // Iterate through each character in the queue
      for (const { from, to, start, end } of this.queue) {
      if (progress >= end / 100) {
      // If animation for this character is complete
      done++;
      out += to; // Append the final character
      } else if (progress >= start / 100) {
      // If character is in the glitch phase
      out += \`<span class="fxzap-3">\${this._randChar()}</span>\`; // Append a random glitch character
      } else {
      // If animation for this character hasn't started yet
      out += from; // Append the original character
      }
      }
      this.el.innerHTML = out; // Update the element's content
      // Check if all characters have completed their animation
      if (done === this.queue.length) {
      this.resolve(); // Resolve the promise
      } else {
      this.frame++; // Increment frame counter
      // Request the next animation frame
      this.animFrame = requestAnimationFrame(() => this._tick());
      }
      }
      /**
      * Returns a random character from the selected character set.
      * @returns {string} A random character.
      */
      _randChar() {
      return this.chars[(Math.random() * this.chars.length) | 0];
      }
      }
      // Get the element where the glitch text will be displayed
      const fx3Element = document.getElementById("fxtext-3");
      // Create an instance of the EnergyFluxGlitch class
      const fx3 = new EnergyFluxGlitch(fx3Element);
      /**
      * Function to start the glitch animation.
      */
      function startFx3Anim() {
      fx3.animateTo(FX3_TARGET_STR); // Animate to the target string
      }
      // Add event listener to start the animation when the window finishes loading
      window.addEventListener("load", startFx3Anim);
  </script>
</body>

</html>`;
