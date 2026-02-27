let cols = 40,
  rows = 30;
let grid = new Array(cols);
let w, h, start, end;
let openSet = [],
  closedSet = [],
  path = [];
let isRunning = false,
  currentAlgorithm = '',
  noPathFound = false;
let draggingStart = false,
  draggingEnd = false,
  isPainting = true;

function setup() {
  let canvas = createCanvas(windowWidth - 320, windowHeight - 40);
  canvas.parent('canvas-container');
  w = width / cols;
  h = height / rows;
  for (let i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
    for (let j = 0; j < rows; j++) grid[i][j] = new Node(i, j);
  }
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) grid[i][j].addNeighbors(grid);
  }
  start = grid[5][floor(rows / 2)];
  end = grid[cols - 6][floor(rows / 2)];
  start.wall = false;
  end.wall = false;

  select('#btn-astar').mousePressed(() => startAlgorithm('A*'));
  select('#btn-dijkstra').mousePressed(() => startAlgorithm('Dijkstra'));
  select('#btn-bfs').mousePressed(() => startAlgorithm('BFS'));
  select('#btn-dfs').mousePressed(() => startAlgorithm('DFS'));
  select('#btn-clear-path').mousePressed(clearPathOnly);
  select('#btn-clear-all').mousePressed(resetFullGrid);
}

function draw() {
  background(255);
  if (mouseIsPressed && !isRunning) {
    let i = floor(mouseX / w),
      j = floor(mouseY / h);
    if (grid[i] && grid[i][j]) {
      let node = grid[i][j];
      if (!draggingStart && !draggingEnd) {
        if (node === start) draggingStart = true;
        else if (node === end) draggingEnd = true;
      }
      if (draggingStart && node !== end) {
        start = node;
        start.wall = false;
      } else if (draggingEnd && node !== start) {
        end = node;
        end.wall = false;
      } else if (
        !draggingStart &&
        !draggingEnd &&
        node !== start &&
        node !== end
      ) {
        if (keyIsDown(84)) {
          // Pantano con tecla T
          node.isDifficult = true;
          node.weight = 15;
          node.wall = false;
        } else {
          node.wall = isPainting;
          if (node.wall) {
            node.isDifficult = false;
            node.weight = 1;
          }
        }
      }
    }
  }

  if (isRunning) {
    for (let n = 0; n < 3; n++) {
      if (currentAlgorithm === 'A*') performAStar();
      else if (currentAlgorithm === 'Dijkstra') performDijkstra();
      else if (currentAlgorithm === 'BFS') performBFS();
      else if (currentAlgorithm === 'DFS') performDFS();
    }
  }

  for (let i = 0; i < cols; i++) grid[i].forEach((n) => n.show());

  if (noPathFound) {
    fill(255, 105, 180, 220);
    noStroke();
    rect(width / 2 - 150, height / 2 - 40, 300, 80, 20);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);
    text('¡UPS! \nNo hay camino posible', width / 2, height / 2);
    textStyle(NORMAL);
  }
}

function closeModal() {
  document.getElementById('welcome-modal').style.display = 'none';
}

function mousePressed() {
  if (!isRunning) {
    noPathFound = false;
    let i = floor(mouseX / w),
      j = floor(mouseY / h);
    if (grid[i] && grid[i][j]) {
      let node = grid[i][j];
      if (node !== start && node !== end) {
        isPainting = !node.wall;
        node.wall = isPainting;
        if (!isPainting) {
          node.isDifficult = false;
          node.weight = 1;
        }
      }
    }
  }
}

function mouseReleased() {
  draggingStart = false;
  draggingEnd = false;
}

function Node(i, j) {
  this.i = i;
  this.j = j;
  this.f = 0;
  this.g = 0;
  this.h = 0;
  this.neighbors = [];
  this.previous = undefined;
  this.wall = false;
  this.isDifficult = false;
  this.weight = 1;

  this.show = function () {
    stroke(255, 240, 245);
    fill(255);
    if (this.wall) fill(255, 183, 206);
    else if (this.isDifficult) fill(242, 210, 189);
    else if (closedSet.includes(this)) fill(221, 160, 221, 180);
    else if (openSet.includes(this)) fill(135, 206, 235, 180);
    if (path.includes(this) && this !== start) fill(255, 240, 245);
    rect(this.i * w, this.j * h, w - 1, h - 1, 4);
    if (path.includes(this) && this !== start) {
      noStroke();
      fill(255, 105, 180);
      ellipse(
        this.i * w + w / 2,
        this.j * h + h / 2,
        this === end ? w * 0.3 : w * 0.4,
      );
    }

    let isExplored =
      closedSet.includes(this) || openSet.includes(this) || path.includes(this);
    if (select('#check-h').checked() && !this.wall && isExplored) {
      let hVal = abs(this.i - end.i) + abs(this.j - end.j);
      fill(155, 89, 182);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(w * 0.35);
      text(hVal, this.i * w + w / 2, this.j * h + h / 2);
    }

    textAlign(CENTER, CENTER);
    textSize(w * 0.8);
    if (this === start) {
      text('🌸', this.i * w + w / 2, this.j * h + h / 2 + h * 0.05);
    }
    if (this === end) {
      text('✨', this.i * w + w / 2, this.j * h + h / 2 + h * 0.05);
    }
  };

  this.addNeighbors = function (grid) {
    let i = this.i,
      j = this.j;
    if (i < cols - 1) this.neighbors.push(grid[i + 1][j]);
    if (i > 0) this.neighbors.push(grid[i - 1][j]);
    if (j < rows - 1) this.neighbors.push(grid[i][j + 1]);
    if (j > 0) this.neighbors.push(grid[i][j - 1]);
  };
}

// Algoritmos (A*, Dijkstra, BFS, DFS)
function startAlgorithm(algo) {
  clearPathOnly();
  currentAlgorithm = algo;
  openSet = [start];
  isRunning = true;
}
function performAStar() {
  if (openSet.length > 0) {
    let winner = 0;
    for (let i = 0; i < openSet.length; i++)
      if (openSet[i].f < openSet[winner].f) winner = i;
    let current = openSet[winner];
    if (current === end) {
      isRunning = false;
      updatePath(end);
      return;
    }
    removeFromArray(openSet, current);
    closedSet.push(current);
    for (let neighbor of current.neighbors) {
      if (!closedSet.includes(neighbor) && !neighbor.wall) {
        let tempG = current.g + neighbor.weight;
        let newPath = false;
        if (openSet.includes(neighbor)) {
          if (tempG < neighbor.g) {
            neighbor.g = tempG;
            newPath = true;
          }
        } else {
          neighbor.g = tempG;
          newPath = true;
          openSet.push(neighbor);
        }
        if (newPath) {
          neighbor.h = abs(neighbor.i - end.i) + abs(neighbor.j - end.j);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.previous = current;
        }
      }
    }
    updatePath(current);
  } else {
    isRunning = false;
    noPathFound = true;
  }
}

function performDijkstra() {
  if (openSet.length > 0) {
    let winner = 0;
    for (let i = 0; i < openSet.length; i++)
      if (openSet[i].g < openSet[winner].g) winner = i;
    let current = openSet[winner];
    if (current === end) {
      isRunning = false;
      updatePath(end);
      return;
    }
    removeFromArray(openSet, current);
    closedSet.push(current);
    for (let neighbor of current.neighbors) {
      if (!closedSet.includes(neighbor) && !neighbor.wall) {
        let tempG = current.g + neighbor.weight;
        if (openSet.includes(neighbor)) {
          if (tempG < neighbor.g) {
            neighbor.g = tempG;
            neighbor.previous = current;
          }
        } else {
          neighbor.g = tempG;
          neighbor.previous = current;
          openSet.push(neighbor);
        }
      }
    }
    updatePath(current);
  } else {
    isRunning = false;
    noPathFound = true;
  }
}

function performBFS() {
  if (openSet.length > 0) {
    let current = openSet.shift();
    if (current === end) {
      isRunning = false;
      updatePath(end);
      return;
    }
    closedSet.push(current);
    for (let neighbor of current.neighbors) {
      if (
        !closedSet.includes(neighbor) &&
        !openSet.includes(neighbor) &&
        !neighbor.wall
      ) {
        neighbor.previous = current;
        openSet.push(neighbor);
      }
    }
    updatePath(current);
  } else {
    isRunning = false;
    noPathFound = true;
  }
}
function performDFS() {
  if (openSet.length > 0) {
    let current = openSet.pop();
    if (current === end) {
      isRunning = false;
      updatePath(end);
      return;
    }
    closedSet.push(current);
    for (let neighbor of current.neighbors) {
      if (
        !closedSet.includes(neighbor) &&
        !openSet.includes(neighbor) &&
        !neighbor.wall
      ) {
        neighbor.previous = current;
        openSet.push(neighbor);
      }
    }
    updatePath(current);
  } else {
    isRunning = false;
    noPathFound = true;
  }
}
function updatePath(current) {
  path = [];
  let temp = current;
  path.push(temp);
  while (temp && temp.previous) {
    path.push(temp.previous);
    temp = temp.previous;
  }
}
function clearPathOnly() {
  isRunning = false;
  noPathFound = false;
  openSet = [];
  closedSet = [];
  path = [];
  grid.forEach((c) =>
    c.forEach((n) => {
      n.previous = undefined;
      n.f = 0;
      n.g = 0;
      n.h = 0;
    }),
  );
}
function resetFullGrid() {
  clearPathOnly();
  grid.forEach((c) =>
    c.forEach((n) => {
      n.wall = false;
      n.isDifficult = false;
      n.weight = 1;
    }),
  );
}
function removeFromArray(arr, elt) {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] == elt) arr.splice(i, 1);
}
function windowResized() {
  resizeCanvas(windowWidth - 320, windowHeight - 40);
  w = width / cols;
  h = height / rows;
}
