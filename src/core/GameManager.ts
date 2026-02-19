import { EventBus } from './EventBus';
import { BUFF_CONFIG, QUEST_CONFIG } from './config';
import { RNGSystem } from '../systems/RNGSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { BuffSystem } from '../systems/BuffSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { getEligiblePets, getEggImageKey } from '../data/eggs';
import { getBgImageKey } from '../data/backgrounds';
import { RollResult, LevelUpData } from '../types';

export class GameManager {
    rng: RNGSystem;
    progression: ProgressionSystem;
    save: SaveSystem;
    buffs: BuffSystem;
    quests: QuestSystem;
    isRolling = false;
    private questResetTimer = 0;

    constructor() {
        this.save = new SaveSystem();
        const data = this.save.getData();

        this.rng = new RNGSystem();
        this.progression = new ProgressionSystem(data.level, data.xp, data.collection);
        this.buffs = new BuffSystem();
        this.buffs.loadFromSave(data.buffs);
        this.buffs.startSuperCooldown();
        this.quests = new QuestSystem();
        this.quests.loadFromSave(data.quests);

        this.setupListeners();
    }

    private setupListeners(): void {
        EventBus.on('roll-requested', () => this.roll());
        EventBus.on('buff-requested', (buff: string) => this.activateBuff(buff));
        EventBus.on('autoroll-stop', () => this.stopAutoroll());
        EventBus.on('autoroll-start', () => this.startAutoroll());
        EventBus.on('autoroll-toggle', (enabled: boolean) => this.setAutorollToggle(enabled));
    }

    stopAutoroll(): void {
        this.buffs.stopAutoroll();
        EventBus.emit('buffs-changed');
        this.persistSave();
    }

    startAutoroll(): void {
        this.buffs.startAutoroll();
        EventBus.emit('buff-activated', 'autoroll');
        EventBus.emit('buffs-changed');
        this.persistSave();
    }

    setAutorollToggle(enabled: boolean): void {
        this.buffs.setAutorollEnabled(enabled);
        EventBus.emit('buffs-changed');
        this.persistSave();
    }


    roll(): void {
        if (this.isRolling) return;
        this.isRolling = true;

        const eligible = getEligiblePets(this.progression.level);
        const luckMultiplier = this.buffs.consumeForRoll();
        const pet = this.rng.rollPet(eligible, luckMultiplier);
        const result = this.progression.processRoll(pet);
        if (result.isNew) this.save.addNewPet(result.pet.id);

        EventBus.emit('roll-complete', result);
        EventBus.emit('buffs-changed');

        this.quests.onRollComplete(result);
        EventBus.emit('quests-changed');

        const oldEggKey = getEggImageKey(this.progression.level);
        const leveledUp = this.progression.checkLevelUp();
        if (leveledUp) {
            const newEggKey = getEggImageKey(this.progression.level);
            const levelUpData: LevelUpData = {
                level: this.progression.level,
                eggKey: newEggKey,
                bgKey: getBgImageKey(this.progression.level),
                oldEggKey,
                eggChanged: oldEggKey !== newEggKey,
            };
            EventBus.emit('level-up', levelUpData);
        }

        this.persistSave(result);
    }

    finishRoll(): void {
        this.isRolling = false;
    }

    private activateBuff(buff: string): void {
        switch (buff) {
            case 'lucky':
                this.buffs.addLucky(BUFF_CONFIG.lucky.rollsPerAd);
                break;
            case 'super':
                this.buffs.addSuper(BUFF_CONFIG.super.rollsPerAd);
                this.buffs.consumeSuperOffer();
                break;
            case 'epic':
                if (!this.buffs.claimEpic()) return;
                break;
            default:
                return;
        }
        EventBus.emit('buff-activated', buff);
        EventBus.emit('buffs-changed');
        this.persistSave();
    }

    claimQuestReward(questType: 'roll' | 'grade', useAd: boolean): void {
        const cfg = QUEST_CONFIG.rewards[questType];
        const count = useAd ? cfg.adCount : cfg.freeCount;
        const claimed = questType === 'roll'
            ? this.quests.claimRollQuest()
            : this.quests.claimGradeQuest();
        if (!claimed) return;

        if (cfg.buffType === 'lucky') this.buffs.addLucky(count);
        else this.buffs.addSuper(count);

        EventBus.emit('buff-activated', cfg.buffType);
        EventBus.emit('buffs-changed');
        EventBus.emit('quests-changed');
        this.persistSave();
    }

    private persistSave(result?: RollResult): void {
        const data = this.save.getData();
        data.level = this.progression.level;
        data.xp = this.progression.xp;
        data.collection = this.progression.getCollectionArray();
        data.buffs = this.buffs.toSave();
        data.quests = this.quests.toSave();

        if (result) {
            data.totalRolls++;
            data.rollLog.unshift({
                id: result.pet.id,
                grade: result.grade,
                isNew: result.isNew,
                xp: result.xpGained,
            });
            if (data.rollLog.length > 20) data.rollLog.length = 20;
        }

        this.save.save();
    }

    update(deltaMs: number): void {
        this.buffs.update(deltaMs);
        this.questResetTimer += deltaMs;
        if (this.questResetTimer >= 60_000) {
            this.questResetTimer = 0;
            if (this.quests.checkDailyReset()) {
                EventBus.emit('quests-changed');
                this.persistSave();
            }
        }
    }

    /** Save current state (call before scene transitions) */
    saveState(): void { this.persistSave(); }

    getEggImageKey() { return getEggImageKey(this.progression.level); }
    getBgImageKey() { return getBgImageKey(this.progression.level); }
}
