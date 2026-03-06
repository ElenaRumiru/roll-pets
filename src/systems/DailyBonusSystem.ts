import { DailyBonusState, DailyBonusReward } from '../types';
import { DAILY_BONUS_CONFIG, getDefaultDailyBonusState } from '../core/config';
import { getTodayUTC, getSecondsUntilReset } from '../core/DateUtils';

export class DailyBonusSystem {
    private state: DailyBonusState;

    constructor() {
        this.state = getDefaultDailyBonusState();
    }

    loadFromSave(state: DailyBonusState): void {
        this.state = {
            ...state,
            monthMilestonesClaimed: [...state.monthMilestonesClaimed],
        };
        this.checkNewDay();
    }

    /** Returns true if a new day was detected and counters advanced */
    checkNewDay(): boolean {
        const today = getTodayUTC();
        if (this.state.lastLoginDate === today) return false;

        const isFirstEver = this.state.lastLoginDate === '';
        this.state.lastLoginDate = today;
        this.state.claimedToday = false;

        if (isFirstEver) {
            this.state.weekDay = 0;
        } else {
            this.state.weekDay = (this.state.weekDay + 1) % 7;
        }
        return true;
    }

    getTodayReward(): DailyBonusReward {
        return { ...DAILY_BONUS_CONFIG.weeklyRewards[this.state.weekDay] };
    }

    getRewardForDay(dayIndex: number): DailyBonusReward {
        return { ...DAILY_BONUS_CONFIG.weeklyRewards[dayIndex] };
    }

    claimDaily(): DailyBonusReward | null {
        if (this.state.claimedToday) return null;
        this.state.claimedToday = true;
        const reward = this.getTodayReward();

        this.state.totalLogins++;
        if (this.state.totalLogins > DAILY_BONUS_CONFIG.monthCycleDays) {
            this.state.totalLogins = 1;
            this.state.weekDay = 0;
            this.state.monthMilestonesClaimed = [false, false, false, false];
        }

        return reward;
    }

    claimMonthlyMilestone(index: number): number {
        const cfg = DAILY_BONUS_CONFIG;
        if (index < 0 || index >= cfg.milestoneThresholds.length) return 0;
        if (this.state.totalLogins < cfg.milestoneThresholds[index]) return 0;
        if (this.state.monthMilestonesClaimed[index]) return 0;
        this.state.monthMilestonesClaimed[index] = true;
        return cfg.milestoneRewards[index];
    }

    hasUnclaimedReward(): boolean {
        if (!this.state.claimedToday) return true;
        const cfg = DAILY_BONUS_CONFIG;
        for (let i = 0; i < cfg.milestoneThresholds.length; i++) {
            if (this.state.totalLogins >= cfg.milestoneThresholds[i]
                && !this.state.monthMilestonesClaimed[i]) return true;
        }
        return false;
    }

    get totalLogins(): number { return this.state.totalLogins; }
    get weekDay(): number { return this.state.weekDay; }
    get claimedToday(): boolean { return this.state.claimedToday; }
    get monthMilestonesClaimed(): readonly boolean[] { return this.state.monthMilestonesClaimed; }

    getSecondsUntilReset(): number {
        return getSecondsUntilReset();
    }

    toSave(): DailyBonusState {
        return {
            ...this.state,
            monthMilestonesClaimed: [...this.state.monthMilestonesClaimed],
        };
    }

}
