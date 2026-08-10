let paintDrops = [];
const linePool = [
	'Barley bed fountain',
	'Rich and ripe',
	'Sailing in the light',
	'my vacant lake',
	'wandered solitude danced',
	'saw then with waves',
	'I sprout in enormous sky',
	'Sun I eat the sun',
  'summer twilight clouds',
  'clouds are a fountain',
  'twinkle the waves bliss '
];
const lineAnchors = [
	{ x: 0.12, y: 0.18 },
	{ x: 0.58, y: 0.3 },
	{ x: 0.2, y: 0.48 },
	{ x: 0.62, y: 0.66 },
	{ x: 0.14, y: 0.83 },
];
let lastPaintSpawnX;
let lastPaintSpawnY;
const paintDistanceThreshold = 45;
const lineFontScale = 0.075;
const lineFadeSpeed = 1;

let textSlots = [];
let lineBag = [];

function setup() {
	createCanvas(windowWidth, windowHeight);
	pixelDensity(1);
	initializeTextSlots();
}

function draw() {
	background(255);
	updateDrops();
	revealTextWithPaint();
	updateSlotsAndSwap();
	drawTextSlots();
}

//mouse update for paint blobs 
function mouseMoved() {
	if (lastPaintSpawnX === undefined || dist(mouseX, mouseY, lastPaintSpawnX, lastPaintSpawnY) >= paintDistanceThreshold) {
		spawnPaint(mouseX, mouseY);
		lastPaintSpawnX = mouseX;
		lastPaintSpawnY = mouseY;
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

//spawn 2 paint blobs every time mouse moves a distance 
function spawnPaint(x, y) {
	const burstCount = 2;

	for (let i = 0; i < burstCount; i += 1) {
		paintDrops.push({
			x: x + random(-10, 10),
			y: y + random(-10, 10),
			size: random(42, 92),
			life: 255,
			color: color(random(70, 255), random(70, 255), random(70, 255), 220),
			blobs: Array.from({ length: int(random(8, 15)) }, () => ({
				offsetX: random(-1, 1),
				offsetY: random(-1, 1),
				scale: random(0.18, 0.55),
				stretch: random(0.85, 1.15),
			})),
		});
	}
}

// check collision of paint blobs with character bounding boxes to reveal text and color
function revealTextWithPaint() {
	layoutSlotCharacters();

	for (const drop of paintDrops) {
		for (const blob of drop.blobs) {
			const blobX = drop.x + blob.offsetX * drop.size * 0.45;
			const blobY = drop.y + blob.offsetY * drop.size * 0.45;
			const blobRadius = drop.size * blob.scale * 0.5;

			for (const slot of textSlots) {
				for (const character of slot.characters) {
					if (!character.paintable || character.revealed) {
						continue;
					}

					if (circleIntersectsRect(blobX, blobY, blobRadius, character.left, character.top, character.right, character.bottom)) {
						character.revealed = true;
						character.color = [red(drop.color), green(drop.color), blue(drop.color)]; //set character to blob color
					}
				}
			}
		}
	}
}

      // Update and draw the paint drops, fade after a delay
      function updateDrops() {
        noStroke();

        for (let i = paintDrops.length - 1; i >= 0; i -= 1) {
          const drop = paintDrops[i];

          drop.life -= 2.8;

          const alpha = constrain(drop.life, 0, 255);
          const baseSize = drop.size * (0.92 + map(alpha, 0, 255, -0.08, 0.08));

          fill(red(drop.color), green(drop.color), blue(drop.color), alpha);
          ellipse(drop.x, drop.y, baseSize, baseSize * 0.88);

          for (const blob of drop.blobs) {
            const blobSize = baseSize * blob.scale;
            ellipse(drop.x + blob.offsetX * baseSize * 0.45, drop.y + blob.offsetY * baseSize * 0.45, blobSize, blobSize * blob.stretch);
          }

          if (drop.life <= 0 || drop.y - drop.size > height + 40) {
            paintDrops.splice(i, 1);
          }
        }
      }

//draw text depending on revealed or not
  function drawTextSlots() {
    push();
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(min(width, height) * lineFontScale);
    textStyle(BOLD);

    for (const slot of textSlots) {
      const alpha = constrain(slot.fadeAlpha, 0, 255);

      for (const character of slot.characters) {
        if (character.revealed && character.color) {
          fill(character.color[0], character.color[1], character.color[2], alpha);
        } else {
          fill(255, alpha);
        }

        text(character.value, character.drawX, character.drawY);
      }
    }

    pop();
  }

// Layout the characters in each text slot and calculate their bounding boxes for collision detection.
function layoutSlotCharacters() {
	push(); // Save the current drawing state
	textAlign(LEFT, CENTER);
	textSize(min(width, height) * lineFontScale);
	textStyle(BOLD);
	const characterHeight = textAscent() + textDescent();

	for (const slot of textSlots) {
		let currentX = width * slot.x;
		const lineY = height * slot.y;

    for (const character of slot.characters) {
			const characterWidth = textWidth(character.value);

			character.drawX = currentX;
			character.drawY = lineY;
			character.left = currentX;
			character.right = currentX + characterWidth;
			character.top = lineY - characterHeight / 2;
			character.bottom = lineY + characterHeight / 2;

			currentX += characterWidth;
		}
	}

	pop(); // Restore the previous drawing state
}

// check if paint blob intersects with character bounding box
function circleIntersectsRect(circleX, circleY, radius, rectLeft, rectTop, rectRight, rectBottom) {
	const closestX = constrain(circleX, rectLeft, rectRight);
	const closestY = constrain(circleY, rectTop, rectBottom);
	const deltaX = circleX - closestX;
	const deltaY = circleY - closestY;

	return deltaX * deltaX + deltaY * deltaY <= radius * radius;
}

function initializeTextSlots() {
	textSlots = lineAnchors.map((anchor) => createSlot(anchor.x, anchor.y, getNextLine()));
}

// Create a text slot object
function createSlot(x, y, text) {
	return {
		x,
		y,
		text,
		fadeAlpha: 255,
		fading: false,
		characters: buildCharacters(text),
	};
}

function buildCharacters(text) {
	const characters = [];

	for (const value of text) {
		characters.push({
			value,
			paintable: /\S/.test(value),
			revealed: false,
			color: null,
			drawX: 0,
			drawY: 0,
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
		});
	}

	return characters;
}
// Update the text slots fade when complete then swap to the next line
function updateSlotsAndSwap() {
	for (const slot of textSlots) {
		if (!slot.fading && isSlotComplete(slot)) {
			slot.fading = true;
		}

		if (!slot.fading) {
			continue;
		}

		slot.fadeAlpha -= lineFadeSpeed;

		if (slot.fadeAlpha <= 0) {
			setSlotText(slot, getNextLine(slot.text));
		}
	}
}

function isSlotComplete(slot) {
	let hasPaintableCharacter = false;

	for (const character of slot.characters) {
		if (!character.paintable) {
			continue;
		}

		hasPaintableCharacter = true;

		if (!character.revealed) {
			return false;
		}
	}

	return hasPaintableCharacter;
}

function setSlotText(slot, text) {
	slot.text = text;
	slot.characters = buildCharacters(text);
	slot.fadeAlpha = 255;
	slot.fading = false;
}
//get another line from pool (not the same one)
function getNextLine(excludedLine) {
	if (linePool.length === 0) {
		return '';
	}

	if (lineBag.length === 0) {
		refillLineBag();
	}

	let nextLine = lineBag.pop();

	if (linePool.length > 1 && excludedLine !== undefined) {
		let guard = 0;

		while (nextLine === excludedLine && guard < 8) {
			if (lineBag.length === 0) {
				refillLineBag();
			}
			nextLine = lineBag.pop();
			guard += 1;
		}
	}

	return nextLine;
}
//shuffle line pool for random order
function refillLineBag() {
	lineBag = shuffle([...linePool], true);
}
