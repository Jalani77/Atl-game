import { io, Socket } from 'socket.io-client';
import type { Game } from '../game/Game';
import type { ClientMessage, ServerMessage } from '@campus-rivals/shared';

export class NetworkManager {
  private game: Game;
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor(game: Game) {
    this.game = game;
    this.serverUrl = window.location.origin;
  }

  connect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.game.onSocketConnected();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('message', (msg: ServerMessage) => {
      this.handleMessage(msg);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      this.game.onConnectionError(err.message || 'connection failed');
    });
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'welcome':
        this.game.onConnected(msg.playerId, msg.sessionToken);
        break;
      case 'gameState':
        this.game.onGameState(msg.state);
        break;
      case 'playerJoined':
        this.game.onPlayerJoined(msg.player);
        break;
      case 'playerLeft':
        this.game.onPlayerLeft(msg.playerId);
        break;
      case 'playerUpdate':
        this.game.onPlayerUpdate(msg.players);
        break;
      case 'schoolSelected':
        this.game.onSchoolSelected(msg.playerId, msg.school);
        break;
      case 'plotClaimed':
        this.game.onPlotClaimed(msg.playerId, msg.plotId, msg.campus);
        break;
      case 'buildingPurchased':
        this.game.onBuildingPurchased(msg.building, msg.pads);
        break;
      case 'cashUpdate':
        this.game.onCashUpdate(msg.playerId, msg.cash, msg.income);
        break;
      case 'spiritUpdate':
        this.game.onSpiritUpdate(msg.playerId, msg.spirit);
        break;
      case 'damage':
        this.game.onDamage(msg.targetId, msg.damage, msg.health, msg.attackerId);
        break;
      case 'knockout':
        this.game.onKnockout(msg.targetId, msg.attackerId, msg.targetType);
        break;
      case 'respawned':
        this.game.onRespawned(msg.entityId, msg.position, msg.entityType);
        break;
      case 'npcUpdate':
        this.game.onNPCUpdate(msg.npcs);
        break;
      case 'bannerUpdate':
        this.game.onBannerUpdate(msg.banners);
        break;
      case 'rivalryUpdate':
        this.game.onRivalryUpdate(msg.scores);
        break;
      case 'error':
        this.game.onError(msg.code, msg.message);
        break;
      case 'pong':
        break;
    }
  }

  send(msg: ClientMessage): void {
    if (this.socket?.connected) {
      this.socket.emit('message', msg);
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
