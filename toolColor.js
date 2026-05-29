function getActiveColor() {
    const nodes = document.querySelectorAll("div.node.main-line-ply");
    if (nodes.length === 0) return 'w';
    return (nodes.length % 2 === 0) ? 'w' : 'b';
}

//

const state = {
    whiteKingMoved: false,
    whiteRookAMoved: false,
    whiteRookHMoved: false,
    blackKingMoved: false,
    blackRookAMoved: false,
    blackRookHMoved: false
};

function resetCastlingState() {
    state.whiteKingMoved = false;
    state.whiteRookAMoved = false;
    state.whiteRookHMoved = false;
    state.blackKingMoved = false;
    state.blackRookAMoved = false;
    state.blackRookHMoved = false;

    history.whiteKingMoved = false;
    history.whiteRookAMoved = false;
    history.whiteRookHMoved = false;
    history.blackKingMoved = false;
    history.blackRookAMoved = false;
    history.blackRookHMoved = false;
}


function checkRookPositions() {
    const pieces = document.getElementsByClassName("piece");

    for (let piece of pieces) {
        const classList = piece.classList;

        if (classList.contains('wr')) {
            if (classList.contains('square-11')) state.whiteRookAMoved = true;
            if (classList.contains('square-81')) state.whiteRookHMoved = true;
        }

        if (classList.contains('br')) {
            if (classList.contains('square-18')) state.blackRookAMoved = true;
            if (classList.contains('square-88')) state.blackRookHMoved = true;
        }

        // Nếu tất cả rook đã di chuyển thì dừng sớm
        if (state.whiteRookAMoved && state.whiteRookHMoved && state.blackRookAMoved && state.blackRookHMoved) {
            break;
        }
    }
}

function checkKingPositions() {
    const pieces = document.getElementsByClassName("piece");

    for (let piece of pieces) {
        const classList = piece.classList;

        if (classList.contains('wk') && classList.contains('square-51')) state.whiteKingMoved = true;
        if (classList.contains('bk') && classList.contains('square-58')) state.blackKingMoved = true;

        // Nếu cả hai vua đã di chuyển thì dừng sớm
        if (state.whiteKingMoved && state.blackKingMoved) {
            break;
        }
    }
}


const history = {
    whiteKingMoved: false,
    whiteRookAMoved: false,
    whiteRookHMoved: false,
    blackKingMoved: false,
    blackRookAMoved: false,
    blackRookHMoved: false
};


function detectCastlingLoss(nodes) {

    for (const node of nodes) {

        const text = getMoveText(node);
        const isWhite = node.classList.contains("white-move");
        const isBlack = node.classList.contains("black-move");

        // ===== CASTLING (O-O / O-O-O) =====
        if (text === "O-O") {
            if (isWhite) {
                history.whiteKingMoved = true;
                history.whiteRookHMoved = true;
                history.whiteRookAMoved = true;
            } else if (isBlack) {
                history.blackKingMoved = true;
                history.blackRookAMoved = true;
                history.blackRookHMoved = true;
            }
            continue; // đã xử lý xong node này
        }

        if (text === "O-O-O") {
            if (isWhite) {
                history.whiteKingMoved = true;
                history.whiteRookHMoved = true;
                history.whiteRookAMoved = true;
            } else if (isBlack) {
                history.blackKingMoved = true;
                history.blackRookAMoved = true;
                history.blackRookHMoved = true;
            }
            continue;
        }

        // ===== CÁC NƯỚC KHÁC (có icon) =====
        const icon = node.querySelector("span.icon-font-chess");
        if (!icon) continue;

        const cls = icon.classList;

        // Trắng
        if (cls.contains("rook-white")) {
            const file = getTargetSquareFromMove(text);

            if (file && (file[0] === "a" || file === "b1" ||
                file === "c1" || file === "d1")) history.whiteRookAMoved = true;

            if (file && (file[0] === "h" || file === "g1" || file === "f1")) history.whiteRookHMoved = true;
        }


        if (cls.contains("king-white")) {
            history.whiteKingMoved = true;
            history.whiteRookAMoved = true;
            history.whiteRookHMoved = true;
        }

        // Đen
        if (cls.contains("rook-black")) {
            const file = getTargetSquareFromMove(text);

            if (file && (file[0] === "a" || file === "b8" ||
                file === "c8" || file === "d8")) history.blackRookAMoved = true;

            if (file && (file[0] === "h" || file === "g8" || file === "f8")) history.blackRookHMoved = true;
        }

        if (cls.contains("king-black")) {
            history.blackKingMoved = true;
            history.blackRookAMoved = true;
            history.blackRookHMoved = true;
        }

        if (
            history.whiteRookAMoved && history.whiteRookHMoved && history.whiteKingMoved &&
            history.blackRookAMoved && history.blackRookHMoved && history.blackKingMoved
        ) break;
    }
}


function getTargetSquareFromMove(text) {
    // bỏ + # ở cuối
    text = text.replace(/[+#]/g, "");

    // lấy ô đích ở cuối chuỗi
    const match = text.match(/([a-h][1-8])$/);
    if (!match) return null;

    return match[1];
}


function getCastlingString() {
    const nodes = document.querySelectorAll("div.node.main-line-ply");

    if (nodes.length === 0 || nodes.length === 1) {
        resetCastlingState();
        return "KQkq";
    }

    detectCastlingLoss(nodes)
    checkRookPositions();
    checkKingPositions();

    const K = (state.whiteRookHMoved && state.whiteKingMoved && !history.whiteRookHMoved && !history.whiteKingMoved)
    const Q = (state.whiteRookAMoved && state.whiteKingMoved && !history.whiteRookAMoved && !history.whiteKingMoved)
    const k = (state.blackRookHMoved && state.blackKingMoved && !history.blackRookHMoved && !history.blackKingMoved)
    const q = (state.blackRookAMoved && state.blackKingMoved && !history.blackRookAMoved && !history.blackKingMoved)

    let castLing = "";
    if (K) castLing += "K";
    if (Q) castLing += "Q";
    if (k) castLing += "k";
    if (q) castLing += "q";

    if (castLing === "")
        return "-"

    return castLing;

}

function getMoveText(node) {
    const span = node.querySelector(".node-highlight-content");
    if (!span) return "";

    const clone = span.cloneNode(true);
    clone.querySelectorAll(".icon-font-chess").forEach(i => i.remove());
    return clone.textContent.trim();
}


///


function countPawns() {
    const nodes = Array.from(document.querySelectorAll("div.node.main-line-ply"));
    let count = 0;

    for (let i = nodes.length - 1; i >= 0; i--) {
        const span = nodes[i].querySelector("span.node-highlight-content");
        if (!span) continue;

        const text = span.textContent.trim();
        if (text === "O-O" || text === "O-O-O") {
            count++;
            continue;
        }

        const hasChessIcon = span.querySelector(".icon-font-chess");
        const isCapture = text.includes("x");

        if (!hasChessIcon || isCapture) {
            return count;
        }

        // Các nước khác
        count++;
    }

    return count;
}

///
function getEnPassantSquare(board) {
    const highlights = Array.from(document.getElementsByClassName('highlight'))
        .filter(el => window.getComputedStyle(el).opacity === '0.5')
        .slice(-2);

    if (highlights.length < 2) return '-';

    const squares = highlights
        .map(el => [...el.classList].find(c => c.startsWith('square-'))?.replace('square-', ''))
        .filter(Boolean);

    if (squares.length < 2) return '-';

    const color = getActiveColor();

    let from, to;
    if (color === "w")
        [from, to] = squares;
    else[to, from] = squares;

    const colFrom = parseInt(from[0]);
    const rowFrom = parseInt(from[1]);

    const colTo = parseInt(to[0]);
    const rowTo = parseInt(to[1]);

    // phải cùng cột và đi 2 ô
    if (colFrom !== colTo || Math.abs(rowFrom - rowTo) !== 2) return '-';

    const a = board[8 - rowTo][colFrom - 1];

    // Ensure that the destination square has a pawn
    if (a !== 'P' && a !== 'p') return '-';

    const moveLeft = board[8 - rowTo][colTo];
    const moveRight = board[8 - rowTo][colTo - 2];

    // Check if the move is from a pawn that moved 2 squares forward and is adjacent to an opposing pawn
    if (a === 'P' && (moveLeft === "p" || moveRight === "p"))
        return String.fromCharCode(96 + colTo) + '3';

    if (a === 'p' && (moveLeft === "P" || moveRight === "P"))
        return String.fromCharCode(96 + colTo) + '6';

    return '-';
}


//

function boardToFENPosition(board) {
    let fenPosition = '';
    for (let row of board) {
        let emptyCount = 0;
        let rowStr = '';

        for (let cell of row) {
            if (cell === '') {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    rowStr += emptyCount;
                    emptyCount = 0;
                }
                rowStr += cell;
            }
        }
        if (emptyCount > 0) {
            rowStr += emptyCount;
        }
        fenPosition += (fenPosition ? '/' : '') + rowStr;
    }
    return fenPosition;
}

//


function getMoveCounters() {
    const nodes = document.querySelectorAll("div.node.main-line-ply");
    let fullmove = 1;

    if (nodes.length > 0) {
        fullmove = Math.floor((nodes.length + 1) / 2);
    }

    return fullmove;
}


///
function addElementDiv(position) {
    const arr = document.getElementsByClassName("highlight");
    const first = arr[0];
    if (!first) return;

    const newDiv = document.createElement("div");
    const x = position.slice(0, 1);
    const y = position.slice(1, 2);
    const xNum = colToNumber(x);

    newDiv.className = `highlight square-${xNum}${y}`;
    newDiv.style.backgroundColor = "rgba(28, 73, 198, 0.8)";
    newDiv.style.opacity = "0.8";
    newDiv.setAttribute("data-test-element", "highlight");
    newDiv.setAttribute("data-test-type", "highlight");

    first.parentNode.insertBefore(newDiv, first);
}

function removeCustomHighlights() {
    const allElements = Array.from(document.querySelectorAll(".highlight"));

    allElements.forEach(el => {
        const bgColor = el.style.backgroundColor;
        if (bgColor === "rgba(28, 73, 198, 0.8)" || bgColor === "rgb(28, 73, 198)") {
            el.remove();
        }
    });
}


function colToNumber(col) {
    return col.charCodeAt(0) - "a".charCodeAt(0) + 1;
}

//
async function analyzePosition(fen) {
    const depth = 10;
    //console.log("|| FEN:", fen);

    try {
        const response = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}`);
        const data = await response.json();

        const str = data.bestmove;
        const bestMove = str.split(" ")[1];

        const from = bestMove.slice(0, 2);
        const to = bestMove.slice(2, 4);

        addElementDiv(from);
        addElementDiv(to);

    } catch (err) {
        console.error("X Lỗi API:", err.response?.data);
    }
}




//lay mau cua minh
function myColorPiece() {
    const elem = document.querySelector('text[x="97.5"][y="99"]');
    return elem.textContent === "a" ? "b" : "w";
}

// lay color nuoc hien tai
function getColorJustMoved(moveNumber) {
    return (moveNumber % 2 === 1) ? 'b' : 'w';
}


//tao ma tran
function getBoardFromHTML() {
    const board = Array(8).fill(null).map(() => Array(8).fill(''));
    const pieces = document.getElementsByClassName("piece");

    const pieceMap = {
        'wp': 'P', 'wn': 'N', 'wb': 'B', 'wr': 'R', 'wq': 'Q', 'wk': 'K',
        'bp': 'p', 'bn': 'n', 'bb': 'b', 'br': 'r', 'bq': 'q', 'bk': 'k'
    };

    for (let piece of pieces) {
        const classList = piece.classList;
        let pieceType = '';
        let square = '';

        for (let className of classList) {
            if (pieceMap[className]) {
                pieceType = pieceMap[className];
            }
            if (className.startsWith('square-')) {
                square = className.replace('square-', '');
            }
        }

        if (pieceType && square) {
            const col = parseInt(square[0]) - 1;
            const row = 8 - parseInt(square[1]);

            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                board[row][col] = pieceType;
            }
        }
    }

    return board;
}


// tao fen
function htmlBoardToFEN() {
    const board = getBoardFromHTML();
    const fenPosition = boardToFENPosition(board);
    const activeColor = getActiveColor();
    const castling = getCastlingString();
    const enPassant = getEnPassantSquare(board);
    const countPawnsA = countPawns();
    const fullMove = getMoveCounters();

    return `${fenPosition} ${activeColor} ${castling} ${enPassant} ${countPawnsA} ${fullMove}`;
}

// so sanh su khac biet
let lastDataNode = null;
let processingMove = false;

function handleMoveChange() {
    if (processingMove) return;
    processingMove = true;

    setTimeout(() => {
        const nodes = document.querySelectorAll("div.node.main-line-ply");
        if (nodes.length === 0) {
            processingMove = false;
            return;
        }

        const lastNode = nodes[nodes.length - 1];
        const currentDataNode = lastNode.getAttribute("data-node");

        if (currentDataNode === lastDataNode) {
            processingMove = false;
            return;
        }

        //neu khac node truoc
        removeCustomHighlights()
        lastDataNode = currentDataNode;

       // const moveText = lastNode.textContent.trim();
        const moveNumber = nodes.length;
        //const color = getColorJustMoved(moveNumber);

        //console.log(`|| Nước ${moveNumber}: ${moveText} (${color !== 'w' ? 'Trắng' : 'Đen'})`);


        const fen = htmlBoardToFEN();
        const activeColor = fen.split(' ')[1];
        const myColor = myColorPiece();

        //neu khac mau goi api
        if (activeColor === myColor) {
            setTimeout(() => analyzePosition(fen), 260);
        }

        processingMove = false;
    }, 80);
}


function setupAutoAnalysis() {
    const container = document.querySelector(".move-list") ||
        document.querySelector(".moves") ||
        document.querySelector(".main-line") ||
        document.body;

    const observer = new MutationObserver(handleMoveChange);

    observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-node"]
    });

    // Phân tích vị trí ban đầu
    const nodes = document.querySelectorAll("div.node.main-line-ply");
    if (nodes.length > 0) {
        lastDataNode = nodes[nodes.length - 1].getAttribute("data-node");

        const myColor = myColorPiece();
        const fen = htmlBoardToFEN();
        const activeColor = fen.split(' ')[1];

        if (activeColor === myColor) {
            setTimeout(() => analyzePosition(), 260);
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAutoAnalysis);
} else {
    setupAutoAnalysis();
}


