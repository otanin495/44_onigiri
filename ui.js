class UIController {
    constructor() {
        this.validMovesVisible = false;
        this.isGameEnding = false;
        this.resizeTimeout = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        document.getElementById('resetBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('titleSoundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('detailsBtn').addEventListener('click', () => this.showDetailsModal());
        document.getElementById('detailsCloseBtn').addEventListener('click', () => this.hideDetailsModal());
        
        window.addEventListener('resize', () => this.debounceResize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.debounceResize(), 100);
            setTimeout(() => this.debounceResize(), 300);
            setTimeout(() => this.debounceResize(), 600);
        });
        window.addEventListener('load', () => this.onWindowResize());
        window.addEventListener('DOMContentLoaded', () => this.onWindowResize());
    }

    startGame() {
        if (window.audioController) {
            window.audioController.playSound('startGame');
        }
        if (window.innerWidth > window.innerHeight && window.innerHeight < 600) {
            return;
        }
        
        document.getElementById('titleScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        if (window.gameController) {
            window.gameController.startNewGameSession();
        }
    }

    setButtonsEnabled(enabled) {
        document.getElementById('undoBtn').disabled = !enabled;
        document.getElementById('resetBtn').disabled = !enabled;
    }

    updateScore(playerScore, aiScore) {
        document.getElementById('playerScore').textContent = playerScore;
        document.getElementById('aiScore').textContent = aiScore;
    }

    updateMessage(message) {
        if (message.includes("パス") || message.includes("終局") || message.includes("エラー")) {
            document.getElementById('message').style.display = 'none';
            this.showCenterMessage(message);
        } else {
            document.getElementById('message').style.display = 'block';
            document.getElementById('message').textContent = message;
            document.getElementById('centerMessage').style.display = 'none';
        }
    }

    showCenterMessage(message, duration = 2000) {
        const centerMessage = document.getElementById('centerMessage');
        centerMessage.textContent = message;
        centerMessage.style.display = 'block';
        
        if (duration > 0) {
            setTimeout(() => {
                centerMessage.style.display = 'none';
                if (message === "パス") {
                    document.getElementById('message').style.display = 'block';
                    if (window.gameController && window.gameController.currentPlayer === 0) {
                        document.getElementById('message').textContent = "あなたの番です";
                    } else {
                        document.getElementById('message').textContent = "おにぎりの番です";
                    }
                }
            }, duration);
        }
    }

    updateMoveHistoryDisplay(moveHistory) {
        const moveList = document.getElementById('moveList');
        let html = '';

        let actualMoveNumber = 1;
        
        for (let i = 0; i < moveHistory.length; i++) {
            const move = moveHistory[i];

            if (move.x !== -1) {
                const notation = this.positionToNotation(move.x, move.y);
                const isPlayerMove = move.color === 1;
                
                html += '<div class="move-entry">';
                html += '<span class="move-number">' + actualMoveNumber + '.</span>';
                html += '<span class="move-notation">' + notation + '</span>';
                html += '<span class="move-player ' + (isPlayerMove ? 'black' : 'white') + '"></span>';
                html += '</div>';
                
                actualMoveNumber++;
            }
        }
        
        moveList.innerHTML = html;

        const moveHistoryElement = document.getElementById('moveHistory');
        moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
    }

    positionToNotation(x, y) {
        const columns = ['a', 'b', 'c', 'd'];
        const rows = ['1', '2', '3', '4'];
        return columns[x] + rows[y];
    }

    showGameResult(finalPlayerScore, finalAiScore) {
        document.getElementById('gameOverModal').style.display = 'flex';

        const gameResult = document.getElementById('gameResult');
        const scoreSection = document.getElementById('scoreSection');
        const restartButton = document.getElementById('restartButton');

        gameResult.classList.remove('show');
        gameResult.style.opacity = '0';
        gameResult.style.visibility = 'hidden';
        gameResult.textContent = '';
        
        scoreSection.classList.remove('show');
        scoreSection.style.opacity = '0';
        scoreSection.style.visibility = 'hidden';
        
        restartButton.classList.remove('show');
        restartButton.style.opacity = '0';
        restartButton.style.visibility = 'hidden';
        document.getElementById('finalPlayerScore').textContent = '0';
        document.getElementById('finalAiScore').textContent = '0';

        const modalContent = document.querySelector('.modal-content');
        modalContent.classList.remove('show');

        setTimeout(() => {
            modalContent.classList.add('show');
        }, 100);

        setTimeout(() => {
            let result;
            if (finalPlayerScore > finalAiScore) {
                result = "あなたの勝ち🎉";
            } else if (finalAiScore > finalPlayerScore) {
                result = "おにぎりの勝ち🎉";
            } else {
                result = "引き分け";
            }
            
            gameResult.textContent = result;
            gameResult.style.opacity = '1';
            gameResult.style.visibility = 'visible';
            gameResult.classList.add('show');
        }, 600);

        setTimeout(() => {
            scoreSection.style.opacity = '1';
            scoreSection.style.visibility = 'visible';
            scoreSection.classList.add('show');
            setTimeout(() => {
                let animationsCompleted = 0;
                const checkAllAnimationsComplete = () => {
                    animationsCompleted++;
                    if (animationsCompleted === 2) {
                        setTimeout(() => {
                            const restartButton = document.getElementById('restartButton');
                            restartButton.style.opacity = '1';
                            restartButton.style.visibility = 'visible';
                            restartButton.style.display = 'inline-block';
                            restartButton.style.transform = 'translateY(0)';
                            restartButton.style.pointerEvents = 'auto';
                            restartButton.classList.add('show');
                        }, 300);
                    }
                };
                
                this.animateScore('finalPlayerScore', finalPlayerScore, checkAllAnimationsComplete);
                this.animateScore('finalAiScore', finalAiScore, checkAllAnimationsComplete);
            }, 300);
        }, 1000);
    }

    animateScore(elementId, targetScore, callback) {
        const element = document.getElementById(elementId);
        let currentScore = 0;
        const increment = Math.max(1, Math.ceil(targetScore / 20));
        const frameTime = 40;
        
        const timer = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(timer);
                if (callback) callback();
            }
            element.textContent = currentScore;
        }, frameTime);
    }

    undoMove() {
        if (window.audioController) {
            window.audioController.playSound('undo');
        }
        if (window.gameController) {
            window.gameController.undoMove();
        }
    }

    startNewGame() {
        if (window.audioController) {
            window.audioController.playSound('reset');
        }
        if (this.isGameEnding) {
            return;
        }
        
        document.getElementById('gameOverModal').style.display = 'none';
        
        if (window.gameController) {
            window.gameController.startNewGame();
        }
    }

    restartGameFromModal() {
        if (window.audioController) {
            window.audioController.playSound('startGame');
        }
        
        const gameResult = document.getElementById('gameResult');
        const scoreSection = document.getElementById('scoreSection');
        const restartButton = document.getElementById('restartButton');
        const modalContent = document.querySelector('.modal-content');
        
        gameResult.classList.remove('show');
        scoreSection.classList.remove('show');
        restartButton.classList.remove('show');
        modalContent.classList.remove('show');
        
        setTimeout(() => {
            document.getElementById('gameOverModal').style.display = 'none';
            
            if (this.isGameEnding) {
                return;
            }
            
            if (window.gameController) {
                window.gameController.startNewGame();
            }
        }, 200);
    }

    toggleSound() {
        if (window.audioController) {
            window.audioController.toggleSound();
        }
    }

    showDetailsModal() {
        const modal = document.getElementById('detailsModal');
        const modalContent = document.querySelector('.details-modal-content');
        
        modal.style.display = 'flex';

        setTimeout(() => {
            modalContent.classList.add('show');
        }, 50);
    }
    
    hideDetailsModal() {
        const modal = document.getElementById('detailsModal');
        const modalContent = document.querySelector('.details-modal-content');
        
        modalContent.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    checkOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight && window.innerHeight < 600;
        const orientationWarning = document.getElementById('orientationWarning');
        const gameContainer = document.getElementById('gameContainer');
        const titleScreen = document.getElementById('titleScreen');
        
        if (isLandscape) {
            orientationWarning.style.display = 'flex';
            gameContainer.style.display = 'none';
            titleScreen.style.display = 'none';
        } else {
            orientationWarning.style.display = 'none';
            if (window.gameController && window.gameController.gameState === 'waiting') {
                titleScreen.style.display = 'flex';
                gameContainer.style.display = 'none';
            } else {
                titleScreen.style.display = 'none';
                gameContainer.style.display = 'block';
            }
        }
    }

    onWindowResize() {
        this.checkOrientation();
        if (!(window.innerWidth > window.innerHeight && window.innerHeight < 600)) {
            if (window.gameController && window.gameController.renderer) {
                window.gameController.handleResize();
            }
            this.forceUIReflow();
        }
    }

    forceUIReflow() {
        const ui = document.getElementById('ui');
        const display = ui.style.display;
        ui.style.display = 'none';
        ui.offsetHeight;
        ui.style.display = display || 'flex';
        
        const elements = ['scorePanel', 'moveHistory', 'controls'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.transform = 'translateZ(0)';
                element.offsetHeight;
            }
        });
    }

    debounceResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.onWindowResize();
            if (window.gameController && window.gameController.renderer) {
                setTimeout(() => {
                    window.gameController.renderer.render(window.gameController.scene, window.gameController.camera);
                }, 50);
            }
        }, 100);
    }

    setGameEnding(isEnding) {
        this.isGameEnding = isEnding;
    }

    setValidMovesVisible(visible) {
        this.validMovesVisible = visible;
    }

    getValidMovesVisible() {
        return this.validMovesVisible;
    }
}

window.restartGameFromModal = () => {
    if (window.uiController) {
        window.uiController.restartGameFromModal();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}