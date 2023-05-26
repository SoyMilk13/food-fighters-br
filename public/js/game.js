const screenWidth = window.innerWidth * window.devicePixelRatio;
const screenHeight = window.innerHeight * window.devicePixelRatio;

const config = {
    type: Phaser.AUTO,
    width: screenWidth,
    height: screenHeight,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let angle = 0;

function preload() {
    // Character
    this.load.image('player', 'assets/player.svg');

    // Tiles
    this.load.image('tiles', 'assets/tilesets/food-fighters-br-tiles.png');
    this.load.tilemapTiledJSON('map', 'assets/tilemaps/food-fighters-br-map.tmj');
};

function create() {
    this.socket = io();

    // Map
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('food-fighters-br-tileset', 'tiles');

    // Layers
    const belowLayer = map.createLayer('Below Player', tileset, 0, 0);

    const worldLayer = map.createLayer('World', tileset, 0, 0);
    worldLayer.setCollisionByProperty({ collides: true });

    const aboveLayer = map.createLayer('Above Player', tileset, 0, 0);
    aboveLayer.setDepth(10);

    // Camera
    const camera = this.cameras.main;
    camera.setSize(screenWidth, screenHeight);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Keys
    this.keys = {
        a: this.input.keyboard.addKey(65),
        d: this.input.keyboard.addKey(68),
        w: this.input.keyboard.addKey(87),
        s: this.input.keyboard.addKey(83)
    };
    
    // Socket
    var self = this;
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', (players) => {
        Object.keys(players).forEach((id) => {
            if (players[id].playerId === self.socket.id) {
                player = this.physics.add.sprite(players[self.socket.id].x, players[self.socket.id].y, 'player').setOrigin(0.5, 0.5);
                this.physics.add.collider(player, worldLayer);
                camera.startFollow(player);
                camera.setRoundPixels(true);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
    this.socket.on('newPlayer', (playerInfo) => {
        addOtherPlayers(self, playerInfo);
    });
    this.socket.on('playerDisconnect', (playerId) => {
        self.otherPlayers.getChildren().forEach((otherPlayer) => {
            if (playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        });
    });

    this.socket.on('playerMoved', (playerInfo) => {
        self.otherPlayers.getChildren().forEach((otherPlayer) => {
            if (playerInfo.playerId === otherPlayer.playerId) {
                otherPlayer.setRotation(playerInfo.rotation);
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            }
        });
    });

    // Debug Graphics
    this.input.keyboard.once("keydown-G", (event) => {
        this.physics.world.createDebugGraphic();
    
        const graphics = this.add.graphics().setAlpha(0.75).setDepth(20);
        worldLayer.renderDebug(graphics, {
            tileColor: null,
            collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
            faceColor: new Phaser.Display.Color(40, 39, 37, 255),
        });
    });
};

function update() {
    if (player) {
        // Left & Right
        if (this.keys.a.isDown) {
            player.x--;
        } else if (this.keys.d.isDown) {
            player.x++;
        }
    
        // Up & Down
        if (this.keys.w.isDown) {
            player.y--;
        } else if (this.keys.s.isDown) {
            player.y++;
        }

        // Rotate Player
        rotatePlayer(player, this.input.activePointer);
        
        // Get Position Info
        let x = player.x;
        let y = player.y;
        let r = player.rotation;
        if (player.oldPosition && (x !== player.oldPosition.x || y !== player.oldPosition.y || r !== player.oldPosition.rotation)) {
            this.socket.emit('playerMovement', { x: player.x, y: player.y, rotation: player.rotation });
        }

        player.oldPosition = {
            x: player.x,
            y: player.y,
            rotation: player.rotation
        };
    }
};

function rotatePlayer(player, pointer) {
    let angleToPointer = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
    angleToPointer = angleToPointer - 1.6;
    player.rotation = angleToPointer;
};

function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5);
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
};