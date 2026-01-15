class Minesweeper {
    constructor() {
        this.boardElement = document.getElementById('game-board');
        this.mineCountElement = document.getElementById('mine-count');
        this.timerElement = document.getElementById('timer');
        this.resetBtn = document.getElementById('reset-btn');
        this.faceSpan = this.resetBtn.querySelector('.face');
        
        this.modal = document.getElementById('modal-overlay');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalRestart = document.getElementById('modal-restart');

        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };

        this.currentDifficulty = 'easy';
        this.board = [];
        this.gameActive = false;
        this.mineCount = 0;
        this.flagsPlaced = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.firstClick = true;

        this.bindEvents();
        this.initGame('easy');
    }

    bindEvents() {
        this.resetBtn.addEventListener('click', () => this.initGame(this.currentDifficulty));
        this.modalRestart.addEventListener('click', () => {
            this.closeModal();
            this.initGame(this.currentDifficulty);
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const level = e.target.dataset.level;
                this.currentDifficulty = level;
                this.initGame(level);
            });
        });
    }

    initGame(difficultyKey) {
        clearInterval(this.timerInterval);
        this.timer = 0;
        this.updateTimerDisplay();
        
        const config = this.difficulties[difficultyKey];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        
        this.mineCount = this.totalMines;
        this.flagsPlaced = 0;
        this.gameActive = true;
        this.firstClick = true;
        this.board = [];
        
        this.faceSpan.textContent = '🙂';
        this.updateMineCounter();
        this.createBoard();
        this.closeModal();
    }

    createBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
        
        // Initialize logic board
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                const cellData = {
                    r, c,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
                row.push(cellData);
                
                const cellDiv = document.createElement('div');
                cellDiv.classList.add('cell');
                cellDiv.dataset.r = r;
                cellDiv.dataset.c = c;
                
                cellDiv.addEventListener('click', () => this.handleLeftClick(r, c));
                cellDiv.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(r, c);
                });

                this.boardElement.appendChild(cellDiv);
                cellData.element = cellDiv;
            }
            this.board.push(row);
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
            if (this.timer >= 999) clearInterval(this.timerInterval);
        }, 1000);
    }

    updateTimerDisplay() {
        this.timerElement.textContent = this.timer.toString().padStart(3, '0');
    }

    updateMineCounter() {
        const remaining = this.totalMines - this.flagsPlaced;
        this.mineCountElement.textContent = remaining.toString().padStart(3, '0');
    }

    placeMines(safeR, safeC) {
        let placed = 0;
        while (placed < this.totalMines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);

            // Prevent placing mine on first clicked cell or around it (optional, usually just self is safe)
            // Let's ensure the first clicked cell is never a mine.
            if ((r === safeR && c === safeC) || this.board[r][c].isMine) continue;

            this.board[r][c].isMine = true;
            placed++;
        }
    }

    calculateNeighbors() {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].isMine) continue;
                
                let count = 0;
                directions.forEach(([dr, dc]) => {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        if (this.board[nr][nc].isMine) count++;
                    }
                });
                this.board[r][c].neighborMines = count;
            }
        }
    }

    handleLeftClick(r, c) {
        if (!this.gameActive) return;
        const cell = this.board[r][c];
        
        if (cell.isRevealed || cell.isFlagged) return;

        if (this.firstClick) {
            this.placeMines(r, c);
            this.calculateNeighbors();
            this.firstClick = false;
            this.startTimer();
        }

        if (cell.isMine) {
            this.gameOver(false);
        } else {
            this.revealCell(r, c);
            this.faceSpan.textContent = '😮';
            setTimeout(() => { if(this.gameActive) this.faceSpan.textContent = '🙂'; }, 200);
            this.checkWin();
        }
    }

    handleRightClick(r, c) {
        if (!this.gameActive) return;
        const cell = this.board[r][c];
        
        if (cell.isRevealed) return;

        cell.isFlagged = !cell.isFlagged;
        cell.element.classList.toggle('flagged');
        
        if (cell.isFlagged) this.flagsPlaced++;
        else this.flagsPlaced--;
        
        this.updateMineCounter();
    }

    revealCell(r, c) {
        const cell = this.board[r][c];
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;
        cell.element.classList.add('revealed');

        if (cell.neighborMines > 0) {
            cell.element.textContent = cell.neighborMines;
            cell.element.setAttribute('data-num', cell.neighborMines);
        } else {
            // Flood fill
            // cell.element.textContent = ''; // Empty for 0
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            directions.forEach(([dr, dc]) => {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    this.revealCell(nr, nc);
                }
            });
        }
    }

    gameOver(won) {
        this.gameActive = false;
        clearInterval(this.timerInterval);
        
        if (won) {
            this.faceSpan.textContent = '😎';
            this.showModal('YOU WON!', `Time: ${this.timer} seconds`);
            this.flagAllMines();
        } else {
            this.faceSpan.textContent = '😵';
            this.showModal('GAME OVER', 'You hit a mine!');
            this.revealAllMines();
        }
    }

    revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c];
                if (cell.isMine) {
                    cell.element.classList.add('mine');
                } else if (cell.isFlagged) {
                    // Incorrect flag
                    cell.element.classList.add('wrong-flag'); // Add logic for this in CSS if needed
                }
            }
        }
    }

    flagAllMines() {
         for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c];
                if (cell.isMine && !cell.isFlagged) {
                    cell.isFlagged = true;
                    cell.element.classList.add('flagged');
                }
            }
        }       
    }

    checkWin() {
        let safeCellsUnknown = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].isMine && !this.board[r][c].isRevealed) {
                    safeCellsUnknown++;
                }
            }
        }

        if (safeCellsUnknown === 0) {
            this.gameOver(true);
        }
    }

    showModal(title, msg) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = msg;
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }
}

// Start the game
window.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
