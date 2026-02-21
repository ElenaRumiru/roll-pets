import { t } from '../data/locales';

export class NicknamePrompt {
    private overlay: HTMLDivElement;
    private inputPlugin: Phaser.Input.InputPlugin | null;

    constructor(onSubmit: (name: string) => void, inputPlugin?: Phaser.Input.InputPlugin) {
        this.inputPlugin = inputPlugin ?? null;
        if (this.inputPlugin) this.inputPlugin.enabled = false;

        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: '9999',
            fontFamily: 'Arial Black, Arial, sans-serif',
        });

        const box = document.createElement('div');
        Object.assign(box.style, {
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '12px',
            padding: '24px 32px',
            textAlign: 'center',
            border: '2px solid rgba(255,255,255,0.15)',
        });

        const label = document.createElement('div');
        label.textContent = t('nickname_prompt');
        Object.assign(label.style, {
            color: '#ffffff', fontSize: '18px', marginBottom: '16px',
            textShadow: '2px 2px 0 #000',
        });
        box.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 15;
        input.placeholder = t('default_nickname');
        Object.assign(input.style, {
            width: '200px', padding: '8px 12px',
            fontSize: '16px', borderRadius: '8px',
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.5)', color: '#ffffff',
            textAlign: 'center', outline: 'none',
            fontFamily: 'Arial Black, Arial, sans-serif',
        });
        box.appendChild(input);

        const br = document.createElement('div');
        br.style.height = '12px';
        box.appendChild(br);

        const btn = document.createElement('button');
        btn.textContent = t('nickname_ok');
        Object.assign(btn.style, {
            padding: '8px 32px', fontSize: '16px',
            borderRadius: '8px', border: 'none',
            background: '#00b06f', color: '#ffffff',
            cursor: 'pointer', fontFamily: 'Arial Black, Arial, sans-serif',
            fontWeight: 'bold',
        });
        box.appendChild(btn);

        this.overlay.appendChild(box);
        document.body.appendChild(this.overlay);

        const submit = () => {
            const name = input.value.trim() || t('default_nickname');
            this.destroy();
            onSubmit(name);
        };

        btn.addEventListener('click', submit);
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') submit();
        });
        input.addEventListener('keyup', (e) => e.stopPropagation());
        input.addEventListener('keypress', (e) => e.stopPropagation());

        input.focus();
    }

    destroy(): void {
        if (this.inputPlugin) this.inputPlugin.enabled = true;
        if (this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}
