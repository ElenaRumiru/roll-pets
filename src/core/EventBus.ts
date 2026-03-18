import { Events } from 'phaser';
import type { RollResult, LevelUpData, LeaguePromotionData, RebirthData } from '../types';
import type { CollectionEvent } from '../systems/CollectionTracker';

// ── Event name → payload mapping ──

export interface GameEventMap {
    'roll-requested':          [];
    'roll-complete':           [result: RollResult];
    'level-up':                [data: LevelUpData];
    'league-promotion':        [data: LeaguePromotionData];
    'rebirth-triggered':       [data: RebirthData];
    'rebirth-complete':        [];
    'buff-activated':          [buffType: string];
    'buffs-changed':           [];
    'autoroll-stop':           [];
    'autoroll-start':          [];
    'autoroll-toggle':         [enabled: boolean];
    'buff-requested':          [buffType: string];
    'shop-purchase':           [petId: string];
    'egg-purchased':           [tier: number];
    'daily-bonus-claimed':     [];
    'daily-milestone-claimed': [];
    'quests-changed':          [];
    'daily-bonus-changed':     [];
    'collections-changed':     [event: CollectionEvent];
    'collection-claimed':      [collectionId: string];
    'nests-changed':           [];
    'nickname-changed':        [nickname: string];
    'assets-loaded':           [batchType: string];
}

// ── Typed facade over Phaser's EventEmitter ──

type EventName = keyof GameEventMap;

interface TypedEventEmitter {
    emit<K extends EventName>(event: K, ...args: GameEventMap[K]): boolean;
    on<K extends EventName>(event: K, fn: (...args: GameEventMap[K]) => void, context?: object): this;
    off<K extends EventName>(event: K, fn?: (...args: GameEventMap[K]) => void, context?: object): this;
    once<K extends EventName>(event: K, fn: (...args: GameEventMap[K]) => void, context?: object): this;
}

export const EventBus = new Events.EventEmitter() as unknown as TypedEventEmitter;
