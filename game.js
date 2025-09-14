let scene, camera, renderer, raycaster, mouse;
let board = [];
let gameState = 'waiting';
let currentPlayer = 0;
let moveHistory = [];
let boardPieces = [];
let validMovesHighlights = [];
let isAnimating = false;
let lastMoveHighlight = null;
let initialAnimationDone = false;
let gameNotation = [];
let isGameEnding = false;
let validMovesVisible = false;

function initializeGameEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6fa8dc);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    adjustCameraForScreenSize();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(-10, 10, -5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createBoard();
    createCoordinateLabels();

    renderer.domElement.addEventListener('click', onBoardClick);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    animate();
}

function adjustCameraForScreenSize() {
    const width = window.innerWidth;
    
    if (width <= 450) {
        camera.position.set(0, 9.4, 6.5);
        camera.fov = 68;
    } else if (width <= 500) {
        camera.position.set(0, 9.4, 6.5);
        camera.fov = 65;
    } else if (width <= 768) {
        camera.position.set(0, 8, 6);
        camera.fov = 62;
    } else if (width <= 1024) {
        camera.position.set(0, 6.2, 4.1);
        camera.fov = 60;
    } else {
        camera.position.set(0, 6, 4);
        camera.fov = 60;
    }
    
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    if (renderer && scene) {
        renderer.render(scene, camera);
    }
}

function createBoard() {
    const boardGeometry = new THREE.BoxGeometry(5, 0.3, 5);
    const boardMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
    boardMesh.receiveShadow = true;
    scene.add(boardMesh);

    for (let i = 0; i <= 4; i++) {
        const vLineGeometry = new THREE.BoxGeometry(0.05, 0.31, 5);
        const vLineMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const vLine = new THREE.Mesh(vLineGeometry, vLineMaterial);
        vLine.position.set(-2.5 + i * 1.25, 0.1, 0);
        scene.add(vLine);

        const hLineGeometry = new THREE.BoxGeometry(5, 0.31, 0.05);
        const hLineMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const hLine = new THREE.Mesh(hLineGeometry, hLineMaterial);
        hLine.position.set(0, 0.1, -2.5 + i * 1.25);
        scene.add(hLine);
    }
}

function createCoordinateLabels() {
    const columns = ['a', 'b', 'c', 'd'];
    columns.forEach((col, index) => {
        const geometry = new THREE.PlaneGeometry(0.4, 0.4);
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.fillStyle = 'black';
        context.font = '60px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(col, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshLambertMaterial({ map: texture, transparent: true });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-1.875 + index * 1.25, 0.2, -3.2);
        mesh.rotation.x = -Math.PI / 2;
        mesh.userData = { isCoordinateLabel: true };
        scene.add(mesh);
    });

    const rows = ['1', '2', '3', '4'];
    rows.forEach((row, index) => {
        const geometry = new THREE.PlaneGeometry(0.4, 0.4);
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.fillStyle = 'black';
        context.font = '60px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(row, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshLambertMaterial({ map: texture, transparent: true });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-3.2, 0.2, -1.875 + index * 1.25);
        mesh.rotation.x = -Math.PI / 2;
        mesh.userData = { isCoordinateLabel: true };
        scene.add(mesh);
    });
}

function recreateCoordinateLabels() {
    scene.children.forEach(child => {
        if (child.userData && child.userData.isCoordinateLabel) {
            scene.remove(child);
        }
    });
    createCoordinateLabels();
}

function animateInitialPieces(callback) {
    if (isAnimating && initialAnimationDone) {
        return;
    }

    boardPieces.forEach(piece => scene.remove(piece));
    boardPieces = [];

    const initialPositions = [
        {x: 1, y: 1, color: 2}, 
        {x: 2, y: 1, color: 1}, 
        {x: 1, y: 2, color: 1}, 
        {x: 2, y: 2, color: 2}   
    ];

    let placedPieces = 0;
    const totalPieces = initialPositions.length;
    let callbackExecuted = false; 
    
    initialPositions.forEach((pos, index) => {
        setTimeout(() => {
            if (callbackExecuted) return;
            
            dropPieceWithBounce(pos.x, pos.y, pos.color, () => {
                placedPieces++;
                playSound('placePiece');
                if (placedPieces === totalPieces && !callbackExecuted) {
                    callbackExecuted = true;
                    setTimeout(() => {
                        if (callback && typeof callback === 'function') {
                            callback();
                        }
                    }, 200);
                }
            });
        }, index * 300);
    });
}

function createPieceGeometry() {
    const cylinder = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32);
    
    const colors = [];
    const positions = cylinder.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
        const y = positions[i + 1];
        
        if (y > 0) {
            colors.push(0.2, 0.2, 0.2);
        } else {
            colors.push(1.0, 1.0, 1.0);
        }
    }
    
    cylinder.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return cylinder;
}

function initializeGame() {
    board = [];
    for (let y = 0; y < 4; y++) {
        board[y] = [];
        for (let x = 0; x < 4; x++) {
            board[y][x] = 0; 
        }
    }

    gameState = 'playing';
    currentPlayer = 0;
    moveHistory = [];
    gameNotation = [];
    resetAI();
    isAnimating = false;
    validMovesVisible = false;

    if (lastMoveHighlight) {
        scene.remove(lastMoveHighlight);
        lastMoveHighlight = null;
    }

    hideValidMoves();
    updateMoveHistoryDisplay();

    if (!initialAnimationDone) {
        initialAnimationDone = true;
        setButtonsEnabled(false);
        animateInitialPieces(() => {
            board[1][1] = 2;
            board[1][2] = 1;
            board[2][1] = 1;
            board[2][2] = 2;
            
            updateScore();
            updateMessage("あなたの番です");
            
            setTimeout(() => {
                showValidMoves();
            }, 300);
        });
    } else {
        board[1][1] = 2;
        board[1][2] = 1;
        board[2][1] = 1;
        board[2][2] = 2;
        
        updateBoard();
        updateScore();
        updateMessage("あなたの番です");
        showValidMoves();
    }
}

function replayBoard() {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            board[y][x] = 0;
        }
    }
    
    board[1][1] = 2;
    board[1][2] = 1;
    board[2][1] = 1;
    board[2][2] = 2;
    
    let space = 12;
    let tekazu = 0;
    let current_turn = 0;
    resetAI();

    gameNotation = [];
    
    for (let i = 0; i < moveHistory.length; i++) {
        const move = moveHistory[i];
        
        if (move.x === -1) {
            tekazu += 1;
            current_turn = 1 - current_turn;
        } else {
            const y = move.y;
            const x = move.x;
            const color = move.color;
            
            board[y][x] = color;
            flipPieces(x, y, color, false);
            space -= 1;
            tekazu += 1;

            gameNotation.push(positionToNotation(x, y));
            
            if (color === 1) {
                applyNodeTransformation(y * 4 + x);
            }
            
            if (color === 2) {
                let prev_move = -1;
                for (let j = i - 1; j >= 0; j--) {
                    if (moveHistory[j].color === 1 && moveHistory[j].x !== -1) {
                        prev_move = moveHistory[j].y * 4 + moveHistory[j].x;
                        break;
                    }
                }
                
                if (prev_move !== -1) {
                    const result = onigiri_move(getWhiteNode(), prev_move);
                    if (result.next_node !== -1) {
                        setWhiteNode(result.next_node);
                    }
                }
            }
            
            current_turn = 1 - current_turn;
        }
    }
    
    currentPlayer = current_turn;
    updateMoveHistoryDisplay();
}

function updateBoard() {
    boardPieces.forEach(piece => scene.remove(piece));
    boardPieces = [];

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (board[y][x] !== 0) {
                createPiece(x, y, board[y][x]);
            }
        }
    }
}

function createPiece(x, y, color) {
    const geometry = createPieceGeometry();
    const material = new THREE.MeshLambertMaterial({ 
        vertexColors: true,
        transparent: true,
        opacity: 1
    });
    const piece = new THREE.Mesh(geometry, material);
    
    piece.position.set(
        -1.875 + x * 1.25,
        0.25,
        -1.875 + y * 1.25
    );
    
    if (color === 2) {
        piece.rotation.x = Math.PI;
    }
    
    piece.castShadow = true;
    scene.add(piece);
    boardPieces.push(piece);
}

function onBoardClick(event) {
    if (gameState !== 'playing' || currentPlayer !== 0 || isAnimating || !validMovesVisible) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(boardPlane, intersectPoint);

    const x = Math.floor((intersectPoint.x + 2.5) / 1.25);
    const z = Math.floor((intersectPoint.z + 2.5) / 1.25);

    if (x >= 0 && x < 4 && z >= 0 && z < 4) {
        makeMove(x, z, 1);
    }
}

function makeMove(x, y, color) {
    if (!isValidMove(x, y, color) || isAnimating) return false;

    isAnimating = true;
    playSound('placePiece');
    setButtonsEnabled(false);
    const flipped = flipPieces(x, y, color, true);
    if (flipped.length === 0) {
        isAnimating = false;
        document.getElementById('resetBtn').disabled = false;
        return false;
    }

    fadeOutValidMoves(() => {
        board[y][x] = color;
        moveHistory.push({ x, y, color, flipped: [...flipped] });

        gameNotation.push(positionToNotation(x, y));
        updateMoveHistoryDisplay();

        if (color === 1) {
            applyNodeTransformation(y * 4 + x);
        }

        if (lastMoveHighlight) {
            scene.remove(lastMoveHighlight);
            lastMoveHighlight = null;
        }

        showLastMoveHighlight(x, y);
        updateBoard();

        if (flipped.length > 0) {
            flipPieces(x, y, color, false);

            animateFlippedPieces(flipped, () => {
                updateBoard();
                updateScore();
                isAnimating = false;
                if (color === 1) {
                    const actualPlayerMoves = moveHistory.filter(move => move.color === 1 && move.x !== -1).length;
                    if (actualPlayerMoves >= 1) {
                        setButtonsEnabled(true);
                    }
                } else {
                    setButtonsEnabled(true);
                }
                
                if (checkGameEnd()) {
                    return;
                }
                
                currentPlayer = 1 - currentPlayer;
                
                if (currentPlayer === 1) {
                    updateMessage("おにぎりの番です");
                    setButtonsEnabled(false);
                    setTimeout(() => makeAIMove(), 300);
                } else {
                    const playerMoves = getValidMoves(1);
                    if (playerMoves.length === 0) {
                        currentPlayer = 1;
                        setButtonsEnabled(false);
                        setTimeout(() => makeAIMove(), 300);
                    } else {
                        updateMessage("あなたの番です");
                        showValidMoves();
                    }
                }
            });
        } else {
            updateScore();
            isAnimating = false;
            if (color === 1) {
                const actualPlayerMoves = moveHistory.filter(move => move.color === 1 && move.x !== -1).length;
                if (actualPlayerMoves >= 1) {
                    setButtonsEnabled(true);
                }
            } else {
                setButtonsEnabled(true);
            }
            
            currentPlayer = 1 - currentPlayer;
            
            if (currentPlayer === 1) {
                updateMessage("おにぎりの番です");
                setButtonsEnabled(false); 
                setTimeout(() => makeAIMove(), 300);
            } else {
                const playerMoves = getValidMoves(1);
                if (playerMoves.length === 0) {
                    currentPlayer = 1;
                    setButtonsEnabled(false);
                    setTimeout(() => makeAIMove(), 300);
                } else {
                    updateMessage("あなたの番です");
                    showValidMoves();
                }
            }
        }
    });
    return true;
}

function makeAIMove() {
    if (isAnimating) return;
    playSound('placePiece');
    try {
        let prev_move = -1;
        for (let i = moveHistory.length - 1; i >= 0; i--) {
            if (moveHistory[i].color === 1 && moveHistory[i].x !== -1) {
                prev_move = moveHistory[i].y * 4 + moveHistory[i].x;
                break;
            }
        }
        
        const aiValidMoves = getValidMoves(2);
        
        if (aiValidMoves.length === 0) {
            moveHistory.push({ x: -1, y: -1, color: 2, flipped: [] });
            updateBoard();
            updateScore();
            
            if (checkGameEnd()) {
                return;
            }
            
            currentPlayer = 0;
            setButtonsEnabled(false);
            updateMessage("パス");
            setTimeout(() => {
                updateMessage("あなたの番です");
                setButtonsEnabled(true);
                showValidMoves();
            }, 2000);
            return;
        }
        
        const result = onigiri_move(getWhiteNode(), prev_move);
        
        if (result.cy >= 0 && result.cy < 4 && result.cx >= 0 && result.cx < 4) {
            const isValid = isValidMove(result.cx, result.cy, 2);
            
            if (isValid) {
                isAnimating = true;
                setButtonsEnabled(false);
                const flipped = flipPieces(result.cx, result.cy, 2, true);
                board[result.cy][result.cx] = 2;
                
                moveHistory.push({ 
                    x: result.cx, 
                    y: result.cy, 
                    color: 2, 
                    flipped: [...flipped] 
                });

                gameNotation.push(positionToNotation(result.cx, result.cy));
                updateMoveHistoryDisplay();
                
                if (result.next_node > 0) {
                    setWhiteNode(result.next_node);
                }

                if (lastMoveHighlight) {
                    scene.remove(lastMoveHighlight);
                    lastMoveHighlight = null;
                }

                showLastMoveHighlight(result.cx, result.cy);
                updateBoard();

                if (flipped.length > 0) {
                    flipPieces(result.cx, result.cy, 2, false);
                    
                    animateFlippedPieces(flipped, () => {
                        updateBoard();
                        updateScore();
                        isAnimating = false;
                        setButtonsEnabled(true);
                        
                        if (checkGameEnd()) {
                            return;
                        }
                        
                        const playerMoves = getValidMoves(1);
                        if (playerMoves.length === 0) {
                            updateMessage("パス");
                            currentPlayer = 1;
                            setButtonsEnabled(false); 
                            setTimeout(() => makeAIMove(), 2000);
                        } else {
                            currentPlayer = 0;
                            updateMessage("あなたの番です");
                            showValidMoves();
                        }
                    });
                } else {
                    updateScore();
                    isAnimating = false;
                    setButtonsEnabled(true);
                    
                    if (checkGameEnd()) {
                        return;
                    }
                    
                    const playerMoves = getValidMoves(1);
                    if (playerMoves.length === 0) {
                        updateMessage("パス");
                        currentPlayer = 1;
                        setTimeout(() => makeAIMove(), 2000);
                    } else {
                        currentPlayer = 0;
                        updateMessage("あなたの番です");
                        showValidMoves();
                    }
                }
            } else {
                updateMessage("エラー発生");
                return;
            }
        } else {
            updateMessage("エラー発生");
            return;
        }
        
    } catch (error) {
        updateMessage("エラー発生");
        return;
    }
}

function animateFlippedPieces(flippedPositions, callback) {
    let animationsCompleted = 0;
    const totalAnimations = flippedPositions.length;
    
    if (totalAnimations === 0) {
        callback();
        return;
    }

    flippedPositions.forEach((pos, index) => {
        setTimeout(() => {
            const piece = findPieceAt(pos.x, pos.y);
            if (piece) {
                animateFlip(piece, () => {
                    animationsCompleted++;
                    if (animationsCompleted === totalAnimations) {
                        callback();
                    }
                });
            } else {
                animationsCompleted++;
                if (animationsCompleted === totalAnimations) {
                    callback();
                }
            }
        }, index * 50);
    });
}

function findPieceAt(x, y) {
    const targetX = -1.875 + x * 1.25;
    const targetZ = -1.875 + y * 1.25;
    
    return boardPieces.find(piece => {
        const dx = Math.abs(piece.position.x - targetX);
        const dz = Math.abs(piece.position.z - targetZ);
        return dx < 0.1 && dz < 0.1;
    });
}

function animateFlip(piece, callback) {
    const originalY = piece.position.y;
    const duration = 300;
    const startTime = Date.now();
    const originalRotation = piece.rotation.x;

    let targetRotation;
    if (Math.abs(originalRotation) < 0.1) {
        targetRotation = Math.PI;
    } else {
        targetRotation = 0;
    }

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const heightOffset = Math.sin(progress * Math.PI) * 0.5;
        piece.position.y = originalY + heightOffset;
        
        piece.rotation.x = originalRotation + (targetRotation - originalRotation) * progress;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            piece.position.y = originalY;
            piece.rotation.x = targetRotation;
            playSound('placePiece');
            callback();
        }
    }
    animate();
}

function showValidMoves() {
    const moves = getValidMoves(1);
    
    validMovesHighlights.forEach(highlight => scene.remove(highlight));
    validMovesHighlights = [];
    validMovesVisible = false;

    moves.forEach(move => {
        const geometry = new THREE.RingGeometry(0.3, 0.5, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.6 
        });
        const highlight = new THREE.Mesh(geometry, material);
        highlight.position.set(
            -1.875 + move.x * 1.25,
            0.16,
            -1.875 + move.y * 1.25
        );
        highlight.rotation.x = -Math.PI / 2;
        scene.add(highlight);
        validMovesHighlights.push(highlight);
    });
    setTimeout(() => {
        validMovesVisible = true;
    }, 100);
}

function hideValidMoves() {
    validMovesHighlights.forEach(highlight => scene.remove(highlight));
    validMovesHighlights = [];
    validMovesVisible = false;
}

function showLastMoveHighlight(x, y) {
    const geometry = new THREE.PlaneGeometry(1.25, 1.25);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xff2020, 
        transparent: true, 
        opacity: 0.5 
    });
    lastMoveHighlight = new THREE.Mesh(geometry, material);
    lastMoveHighlight.position.set(
        -1.875 + x * 1.25,
        0.16,
        -1.875 + y * 1.25
    );
    lastMoveHighlight.rotation.x = -Math.PI / 2;
    scene.add(lastMoveHighlight);
}

function fadeOutValidMoves(callback) {
    validMovesVisible = false;

    const duration = 200;
    const startTime = Date.now();
    
    function fade() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const opacity = 0.6 * (1 - progress);
        
        validMovesHighlights.forEach(highlight => {
            highlight.material.opacity = Math.max(0, opacity);
        });
        
        if (progress < 1) {
            requestAnimationFrame(fade);
        } else {
            hideValidMoves();
            callback();
        }
    }
    fade();
}

function isValidMove(x, y, color) {
    if (board[y][x] !== 0) return false;
    return flipPieces(x, y, color, true).length > 0;
}

function flipPieces(x, y, color, dryRun = false) {
    const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
    const flipped = [];

    for (const [dx, dy] of directions) {
        const line = [];
        let nx = x + dx;
        let ny = y + dy;

        while (nx >= 0 && nx < 4 && ny >= 0 && ny < 4 && board[ny][nx] !== 0) {
            if (board[ny][nx] === color) {
                flipped.push(...line);
                break;
            }
            line.push({ x: nx, y: ny });
            nx += dx;
            ny += dy;
        }
    }

    if (!dryRun) {
        flipped.forEach(pos => board[pos.y][pos.x] = color);
    }

    return flipped;
}

function getValidMoves(color) {
    const moves = [];
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (isValidMove(x, y, color)) {
                moves.push({ x, y });
            }
        }
    }
    return moves;
}

function updateScore() {
    let playerScore = 0, aiScore = 0;
    
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (board[y][x] === 1) playerScore++;
            if (board[y][x] === 2) aiScore++;
        }
    }

    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('aiScore').textContent = aiScore;
}

function checkGameEnd() {
    const playerMoves = getValidMoves(1);
    const aiMoves = getValidMoves(2);
    
    if (playerMoves.length === 0 && aiMoves.length === 0) {
        endGame();
        return true;
    }
    return false;
}

function endGame() {
    gameState = 'gameOver';
    isAnimating = true;
    isGameEnding = true;
    hideValidMoves();

    setButtonsEnabled(false);

    if (lastMoveHighlight) {
        scene.remove(lastMoveHighlight);
        lastMoveHighlight = null;
    }

    document.getElementById('message').style.display = 'none';
    showCenterMessage("終局", 2000);
    playSound('finish');

    setTimeout(() => {
        let playerScore = 0, aiScore = 0;
        let emptySpaces = 0;
        
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (board[y][x] === 1) playerScore++;
                else if (board[y][x] === 2) aiScore++;
                else emptySpaces++;
            }
        }

        if (playerScore > aiScore) {
            playerScore += emptySpaces;
        } else if (aiScore > playerScore) {
            aiScore += emptySpaces;
        } else {
            playerScore += Math.floor(emptySpaces / 2);
            aiScore += Math.ceil(emptySpaces / 2);
        }

        animateRemoveAllPieces(() => {
            animateFinalPlacement(playerScore, aiScore);
        });
    }, 2000);
}

function animateRemoveAllPieces(callback) {
    const duration = 800;
    const startTime = Date.now();
    const pieces = [...boardPieces];

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        pieces.forEach((piece, index) => {
            const delay = index * 50;
            const adjustedProgress = Math.max(0, Math.min(1, (elapsed - delay) / (duration - delay)));
            
            if (adjustedProgress > 0) {
                const velocity = 8 * adjustedProgress;
                const gravity = 12 * adjustedProgress * adjustedProgress;
                piece.position.y = 0.25 + velocity - gravity;

                piece.rotation.x += 0.2 * adjustedProgress;
                piece.rotation.z += 0.15 * adjustedProgress;

                if (piece.material) {
                    piece.material.opacity = 1 - adjustedProgress;
                    if (!piece.material.transparent) {
                        piece.material.transparent = true;
                    }
                }
            }
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            boardPieces.forEach(piece => scene.remove(piece));
            boardPieces = [];
            callback();
        }
    }
    animate();
}

function animateFinalPlacement(finalPlayerScore, finalAiScore) {
    const whitePieces = [];
    const blackPieces = [];

    for (let y = 0; y < 4 && whitePieces.length < finalAiScore; y++) {
        for (let x = 0; x < 4 && whitePieces.length < finalAiScore; x++) {
            whitePieces.push({ x, y });
        }
    }

    for (let y = 3; y >= 0 && blackPieces.length < finalPlayerScore; y--) {
        for (let x = 3; x >= 0 && blackPieces.length < finalPlayerScore; x--) {
            blackPieces.push({ x, y });
        }
    }

    let totalPieces = finalPlayerScore + finalAiScore;
    let placedPieces = 0;

    whitePieces.forEach((pos, index) => {
        setTimeout(() => {
            dropPieceWithBounce(pos.x, pos.y, 2, () => {
                placedPieces++;
                playSound('placePiece');
                if (placedPieces === totalPieces) {
                    setTimeout(() => {
                        showGameResult(finalPlayerScore, finalAiScore);
                    }, 500);
                }
            });
        }, index * 100);
    });

    blackPieces.forEach((pos, index) => {
        setTimeout(() => {
            dropPieceWithBounce(pos.x, pos.y, 1, () => {
                placedPieces++;
                playSound('placePiece');
                if (placedPieces === totalPieces) {
                    setTimeout(() => {
                        showGameResult(finalPlayerScore, finalAiScore);
                    }, 500);
                }
            });
        }, index * 100);
    });
}

function dropPieceWithBounce(x, y, color, callback) {
    const geometry = createPieceGeometry();
    const material = new THREE.MeshLambertMaterial({ 
        vertexColors: true,
        transparent: true,
        opacity: 0
    });
    const piece = new THREE.Mesh(geometry, material);
    
    const targetX = -1.875 + x * 1.25;
    const targetZ = -1.875 + y * 1.25;
    piece.position.set(targetX, 6, targetZ);
    
    if (color === 2) {
        piece.rotation.x = Math.PI;
    }
    
    piece.castShadow = true;
    scene.add(piece);
    boardPieces.push(piece);

    const duration = 800;
    const startTime = Date.now();
    const targetY = 0.25;
    const startY = 6;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        piece.material.opacity = Math.min(progress * 2, 1);

        let bounceProgress;
        if (progress < 0.8) {
            bounceProgress = progress / 0.8;
            piece.position.y = startY + (targetY - startY) * bounceProgress * bounceProgress;
        } else {
            const bouncePhase = (progress - 0.8) / 0.2;
            const bounceHeight = 0.3 * (1 - bouncePhase);
            const bounceOffset = Math.sin(bouncePhase * Math.PI * 3) * bounceHeight;
            piece.position.y = targetY + bounceOffset;
        }

        piece.rotation.y = progress * Math.PI * 2;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            piece.position.y = targetY;
            piece.rotation.y = 0;
            piece.material.opacity = 1;
            if (callback && typeof callback === 'function') {
                callback();
            }
        }
    }
    animate();
}

function startNewGame() {
    playSound('reset');
    if (isGameEnding) {
        return; 
    }
    
    document.getElementById('gameOverModal').style.display = 'none';
    
    setButtonsEnabled(false);
    hideValidMoves();
    if (lastMoveHighlight) {
        scene.remove(lastMoveHighlight);
        lastMoveHighlight = null;
    }

    gameState = 'playing';
    currentPlayer = 0;
    moveHistory = [];
    gameNotation = [];
    resetAI();
    isGameEnding = false;
    isAnimating = true; 

    updateMoveHistoryDisplay();
    
    if (boardPieces.length > 0) {
        animateRemoveAllPieces(() => {
            board = [];
            for (let y = 0; y < 4; y++) {
                board[y] = [];
                for (let x = 0; x < 4; x++) {
                    board[y][x] = 0;
                }
            }

            const initialPositions = [
                {x: 1, y: 1, color: 2}, 
                {x: 2, y: 1, color: 1}, 
                {x: 1, y: 2, color: 1}, 
                {x: 2, y: 2, color: 2} 
            ];

            let placedPieces = 0;
            let callbackExecuted = false;
            
            initialPositions.forEach((pos, index) => {
                setTimeout(() => {
                    dropPieceWithBounce(pos.x, pos.y, pos.color, () => {
                        placedPieces++;
                        playSound('placePiece');
                        if (placedPieces === initialPositions.length && !callbackExecuted) {
                            callbackExecuted = true;
                            board[1][1] = 2;
                            board[1][2] = 1;
                            board[2][1] = 1;
                            board[2][2] = 2;
                            
                            isAnimating = false;
                            updateScore();
                            updateMessage("あなたの番です");
                            
                            setTimeout(() => {
                                showValidMoves();
                            }, 300);
                        }
                    });
                }, index * 150);
            });
        });
    } else {
        initializeGame();
    }
}

function restartGameFromModal() {
    playSound('startGame');
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
        
        if (isGameEnding) {
            return; 
        }
        
        setButtonsEnabled(false);
        hideValidMoves();
        if (lastMoveHighlight) {
            scene.remove(lastMoveHighlight);
            lastMoveHighlight = null;
        }

        gameState = 'playing';
        currentPlayer = 0;
        moveHistory = [];
        gameNotation = [];
        resetAI();
        isGameEnding = false;
        isAnimating = true; 

        updateMoveHistoryDisplay();
        
        if (boardPieces.length > 0) {
            animateRemoveAllPieces(() => {
                board = [];
                for (let y = 0; y < 4; y++) {
                    board[y] = [];
                    for (let x = 0; x < 4; x++) {
                        board[y][x] = 0;
                    }
                }

                const initialPositions = [
                    {x: 1, y: 1, color: 2}, 
                    {x: 2, y: 1, color: 1}, 
                    {x: 1, y: 2, color: 1}, 
                    {x: 2, y: 2, color: 2} 
                ];

                let placedPieces = 0;
                let callbackExecuted = false;
                
                initialPositions.forEach((pos, index) => {
                    setTimeout(() => {
                        dropPieceWithBounce(pos.x, pos.y, pos.color, () => {
                            placedPieces++;
                            playSound('placePiece');
                            if (placedPieces === initialPositions.length && !callbackExecuted) {
                                callbackExecuted = true;
                                board[1][1] = 2;
                                board[1][2] = 1;
                                board[2][1] = 1;
                                board[2][2] = 2;
                                
                                isAnimating = false;
                                updateScore();
                                updateMessage("あなたの番です");
                                
                                setTimeout(() => {
                                    showValidMoves();
                                }, 300);
                            }
                        });
                    }, index * 150);
                });
            });
        } else {
            initializeGame();
        }
    }, 200);
}

function startGame() {
    playSound('startGame');
    if (window.innerWidth > window.innerHeight && window.innerHeight < 600) {
        return;
    }
    
    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    initialAnimationDone = false;
    isAnimating = false;
    isGameEnding = false;
    setButtonsEnabled(false);

    initialAnimationDone = false;
    initializeGame();
}

function undoMove() {
    playSound('undo');
    if (moveHistory.length === 0 || gameState !== 'playing' || isAnimating || isGameEnding) {
        return;
    }

    const myTurn = currentPlayer;
    const removedMoves = [];
    
    while (moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        const t = lastMove.color === 1 ? 0 : 1;
        
        removedMoves.push({ t, move: lastMove });
        moveHistory.pop();

        if (lastMove.x !== -1 && gameNotation.length > 0) {
            gameNotation.pop();
        }
        
        if (t === myTurn) {
            break;
        }
    }
    
    replayBoard();

    if (lastMoveHighlight) {
        scene.remove(lastMoveHighlight);
        lastMoveHighlight = null;
    }

    if (moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        if (lastMove.x !== -1) {
            showLastMoveHighlight(lastMove.x, lastMove.y);
        }
    }
    
    updateBoard();
    updateScore();
    
    if (currentPlayer === 0 && getValidMoves(1).length > 0) {
        updateMessage("あなたの番です");
        showValidMoves();
        const actualPlayerMoves = moveHistory.filter(move => move.color === 1 && move.x !== -1).length;
        if (actualPlayerMoves === 0) {
            setButtonsEnabled(false); 
        } else {
            setButtonsEnabled(true);
        }
    } else if (currentPlayer === 1 && getValidMoves(2).length > 0) {
        updateMessage("おにぎりの番です");
        hideValidMoves();
        setTimeout(() => makeAIMove(), 1000);
    } else {
        if (checkGameEnd()) {
            return;
        }
        updateMessage("手がありません");
    }
}

function positionToNotation(x, y) {
    const columns = ['a', 'b', 'c', 'd'];
    const rows = ['1', '2', '3', '4'];
    return columns[x] + rows[y];
}

function updateBoardPositions() {
    boardPieces.forEach((piece, index) => {
        let foundPosition = null;
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const expectedX = -1.875 + x * 1.25;
                const expectedZ = -1.875 + y * 1.25;
                if (Math.abs(piece.position.x - expectedX) < 0.1 && 
                    Math.abs(piece.position.z - expectedZ) < 0.1) {
                    foundPosition = { x, y };
                    break;
                }
            }
            if (foundPosition) break;
        }

        if (foundPosition) {
            piece.position.set(
                -1.875 + foundPosition.x * 1.25,
                0.25,
                -1.875 + foundPosition.y * 1.25
            );
        }
    });

    if (lastMoveHighlight) {
        const lastMove = moveHistory[moveHistory.length - 1];
        if (lastMove && lastMove.x !== -1) {
            lastMoveHighlight.position.set(
                -1.875 + lastMove.x * 1.25,
                0.16,
                -1.875 + lastMove.y * 1.25
            );
        }
    }
}

function onWindowResize() {
    checkOrientation();
    if (!(window.innerWidth > window.innerHeight && window.innerHeight < 600)) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        adjustCameraForScreenSize();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        recreateCoordinateLabels();
        updateBoardPositions();
        forceUIReflow();
        renderer.render(scene, camera);
    }
}

function forceUIReflow() {
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

let resizeTimeout;
function debounceResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        onWindowResize();
        setTimeout(() => {
            renderer.render(scene, camera);
        }, 50);
    }, 100);
}

function animate() {
    requestAnimationFrame(animate);
    
    camera.position.x = Math.sin(Date.now() * 0.0005) * 0.1;
    camera.lookAt(0, 0, 0);
    validMovesHighlights.forEach(highlight => {
        highlight.material.opacity = 0.4 + Math.sin(Date.now() * 0.003) * 0.3;
    });

    renderer.render(scene, camera);
}