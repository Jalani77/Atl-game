import type { Game } from '../game/Game';
import type { SchoolId, CampusState, RivalryScore } from '@campus-rivals/shared';
import { SCHOOLS, PLOTS } from '@campus-rivals/shared';

const ICONS = {
  cash: `<svg class="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#f4c15d" stroke="#a87412" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="11" font-family="Inter,sans-serif" fill="#6a4a08" font-weight="700">C</text></svg>`,
  spirit: `<svg class="hud-icon" viewBox="0 0 24 24" fill="#7d5bd6"><path d="M12 3l2.2 5.6H20l-4.6 3.6 1.8 5.8L12 15.8 6.8 18l1.8-5.8L4 8.6h5.8z"/></svg>`,
  heart: `<svg class="hud-icon" viewBox="0 0 24 24" fill="#e15b4a"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"/></svg>`,
};

export class UIManager {
  private container: HTMLElement;
  private game: Game;
  private uiLayer: HTMLDivElement;
  
  private currentScreen: HTMLElement | null = null;
  private hudElement: HTMLElement | null = null;
  private knockoutOverlay: HTMLElement | null = null;

  constructor(container: HTMLElement, game: Game) {
    this.container = container;
    this.game = game;
    
    this.uiLayer = document.createElement('div');
    this.uiLayer.className = 'ui-layer';
    container.appendChild(this.uiLayer);
  }

  update(_dt: number): void {
    const objective = document.getElementById('hud-objective');
    const prompt = document.getElementById('hud-prompt');
    const dash = document.getElementById('hud-dash') as HTMLElement | null;
    const weapon = document.getElementById('hud-weapon');
    const player = this.game.getLocalPlayer();
    if (!player || !objective) return;

    const campus = player.plotId ? this.game.getCampuses().get(player.plotId) : undefined;
    const owned = new Set(campus?.buildings.map((building) => building.buildingId) ?? []);
    if (!owned.has('admissions')) {
      objective.textContent = 'Open Admissions — step on the station in your courtyard';
    } else if (!owned.has('classroom')) {
      objective.textContent = 'Build your first classroom — follow the highlighted station';
    } else {
      objective.textContent = 'Expand the campus or head out to meet a rival school';
    }

    const near = this.game.nearestPurchase();
    if (prompt) {
      if (near && near.distance < 4) {
        prompt.style.display = 'block';
        prompt.textContent = `Press E to build ${near.name}${near.price > 0 ? ` · ${near.price} cash` : ' · free'}`;
      } else {
        prompt.style.display = 'none';
      }
    }
    if (dash) dash.style.width = `${Math.round(this.game.getDashCooldown() * 100)}%`;
    if (weapon) {
      const id = player.equippedWeapon;
      weapon.textContent = id === 'spirit_blaster' ? 'Spirit Blaster' : 'Foam Baton';
    }
  }

  private clearScreen(): void {
    if (this.currentScreen) {
      this.currentScreen.remove();
      this.currentScreen = null;
    }
  }

  showConnecting(): void {
    this.clearScreen();
    this.currentScreen = this.createScreen(`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);">
        <h1 class="title-font" style="font-size:4rem;color:#fff;text-shadow:0 4px 20px rgba(0,0,0,0.5);margin-bottom:2rem;">CAMPUS RIVALS</h1>
        <div style="color:#aaa;font-size:1.2rem;">Connecting to server...</div>
        <div style="margin-top:2rem;width:60px;height:60px;border:4px solid #333;border-top-color:#3498db;border-radius:50%;animation:spin 1s linear infinite;"></div>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg);}}</style>
    `);
    this.uiLayer.appendChild(this.currentScreen);
  }

  showNameInput(): void {
    this.clearScreen();
    this.currentScreen = this.createScreen(`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);">
        <h1 class="title-font" style="font-size:4rem;color:#fff;text-shadow:0 4px 20px rgba(0,0,0,0.5);margin-bottom:1rem;">CAMPUS RIVALS</h1>
        <p style="color:#aaa;margin-bottom:2rem;">Enter your name to begin</p>
        <input type="text" id="name-input" placeholder="Your Name" maxlength="20" style="padding:1rem 2rem;font-size:1.2rem;border:none;border-radius:8px;background:#2a2a4a;color:#fff;width:300px;text-align:center;outline:none;">
        <button id="name-submit" style="margin-top:1rem;padding:1rem 3rem;font-size:1.2rem;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#3498db,#2980b9);color:#fff;cursor:pointer;transition:transform 0.2s;">
          PLAY
        </button>
      </div>
    `);
    this.uiLayer.appendChild(this.currentScreen);

    const input = this.currentScreen.querySelector('#name-input') as HTMLInputElement;
    const button = this.currentScreen.querySelector('#name-submit') as HTMLButtonElement;
    
    const submit = () => {
      const name = input.value.trim() || `Player${Math.floor(Math.random() * 1000)}`;
      this.game.submitName(name);
    };

    button.onclick = submit;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') submit();
    };
    
    setTimeout(() => input.focus(), 100);
  }

  showSchoolSelect(): void {
    this.clearScreen();
    
    let schoolsHTML = '';
    for (const [id, school] of Object.entries(SCHOOLS)) {
      const takenPlots = 0;
      const availablePlots = PLOTS.filter(p => p.school === id).length - takenPlots;
      
      schoolsHTML += `
        <div class="school-card" data-school="${id}" style="flex:1;min-width:280px;max-width:350px;padding:2rem;background:linear-gradient(135deg,#2a2a4a,#1a1a2e);border-radius:16px;cursor:pointer;transition:transform 0.3s,box-shadow 0.3s;border:3px solid transparent;">
          <div style="width:80px;height:80px;background:${school.color};border-radius:50%;margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:2rem;color:#fff;">⬢</span>
          </div>
          <h2 style="color:#fff;text-align:center;margin-bottom:0.5rem;">${school.name}</h2>
          <p style="color:#888;text-align:center;font-size:0.9rem;margin-bottom:1rem;">${school.description}</p>
          <div style="text-align:center;color:${school.color};font-weight:600;">${availablePlots} plots available</div>
          <div style="text-align:center;color:#666;font-size:0.8rem;margin-top:0.5rem;">"${school.motto}"</div>
        </div>
      `;
    }

    this.currentScreen = this.createScreen(`
      <div style="display:flex;flex-direction:column;align-items:center;padding:2rem;min-height:100%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);">
        <h1 class="title-font" style="font-size:2.5rem;color:#fff;margin-bottom:0.5rem;">CHOOSE YOUR SCHOOL</h1>
        <p style="color:#888;margin-bottom:2rem;">Pick a university to represent</p>
        <div style="display:flex;gap:2rem;flex-wrap:wrap;justify-content:center;max-width:1200px;">
          ${schoolsHTML}
        </div>
      </div>
      <style>
        .school-card:hover {
          transform:translateY(-5px);
          box-shadow:0 10px 40px rgba(0,0,0,0.3);
        }
      </style>
    `);
    this.uiLayer.appendChild(this.currentScreen);

    this.currentScreen.querySelectorAll('.school-card').forEach((card) => {
      card.addEventListener('click', () => {
        const schoolId = (card as HTMLElement).dataset.school as SchoolId;
        this.game.selectSchool(schoolId);
      });
    });
  }

  showPlotSelect(school: SchoolId, campuses: Map<string, CampusState>): void {
    this.clearScreen();
    
    const schoolConfig = SCHOOLS[school];
    const schoolPlots = PLOTS.filter(p => p.school === school);
    
    let plotsHTML = '';
    for (const plot of schoolPlots) {
      const isOwned = campuses.has(plot.id);
      plotsHTML += `
        <div class="plot-card ${isOwned ? 'owned' : ''}" data-plot="${plot.id}" style="padding:1.5rem;background:${isOwned ? '#333' : '#2a2a4a'};border-radius:12px;cursor:${isOwned ? 'not-allowed' : 'pointer'};transition:transform 0.2s;border:2px solid ${isOwned ? '#555' : schoolConfig.color};">
          <div style="font-size:1.2rem;font-weight:600;color:${isOwned ? '#666' : '#fff'};">Plot ${plot.index + 1}</div>
          <div style="color:${isOwned ? '#555' : '#888'};font-size:0.9rem;margin-top:0.5rem;">
            ${isOwned ? 'Claimed' : 'Available'}
          </div>
        </div>
      `;
    }

    this.currentScreen = this.createScreen(`
      <div style="display:flex;flex-direction:column;align-items:center;padding:2rem;min-height:100%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem;">
          <div style="width:40px;height:40px;background:${schoolConfig.color};border-radius:50%;"></div>
          <h1 class="title-font" style="font-size:2rem;color:#fff;">${schoolConfig.name}</h1>
        </div>
        <p style="color:#888;margin-bottom:2rem;">Select your campus plot</p>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;max-width:400px;">
          ${plotsHTML}
        </div>
      </div>
      <style>
        .plot-card:not(.owned):hover {
          transform:scale(1.05);
        }
      </style>
    `);
    this.uiLayer.appendChild(this.currentScreen);

    this.currentScreen.querySelectorAll('.plot-card:not(.owned)').forEach((card) => {
      card.addEventListener('click', () => {
        const plotId = (card as HTMLElement).dataset.plot!;
        this.game.claimPlot(plotId);
      });
    });
  }

  showGameHUD(): void {
    this.clearScreen();
    
    const player = this.game.getLocalPlayer();
    if (!player) return;
    
    const school = player.school ? SCHOOLS[player.school] : null;

    const accent = school?.color ?? '#3aa0e0';
    this.hudElement = this.createScreen(`
      <div id="hud" style="pointer-events:none;">
        <div class="hud-panel" style="position:absolute;top:16px;left:16px;display:flex;gap:12px;align-items:center;padding:10px 14px;pointer-events:auto;">
          <div style="width:36px;height:36px;border-radius:10px;background:${accent};"></div>
          <div>
            <div style="font-weight:800;letter-spacing:.04em;">${school?.shortName ?? 'Campus'}</div>
            <div style="font-size:12px;color:#667085;">${player.name}</div>
          </div>
        </div>

        <div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div class="hud-panel" style="display:flex;gap:18px;padding:10px 16px;">
            <div style="display:flex;align-items:center;gap:8px;">
              ${ICONS.cash}
              <strong id="hud-cash">${player.cash}</strong>
              <span id="hud-income" style="color:#3d7a46;font-size:12px;font-weight:700;">+0 / tick</span>
            </div>
            <div style="width:1px;background:#eadfce;"></div>
            <div style="display:flex;align-items:center;gap:8px;">
              ${ICONS.spirit}
              <strong id="hud-spirit">${player.spirit}</strong>
            </div>
          </div>
          <div id="hud-objective" class="hud-objective">Open Admissions — step on the station in your courtyard</div>
        </div>

        <div class="hud-panel" style="position:absolute;top:16px;right:16px;display:flex;gap:8px;padding:8px;pointer-events:auto;">
          <button id="quality-btn" style="border:0;background:#243044;color:white;border-radius:10px;padding:8px 10px;font-weight:700;cursor:pointer;">Shadows</button>
          <span id="connection-dot" title="Connected" style="width:12px;height:12px;border-radius:50%;background:#3dba6c;align-self:center;margin:0 6px;"></span>
        </div>

        <div id="hud-prompt" class="hud-panel" style="display:none;position:absolute;left:50%;bottom:108px;transform:translateX(-50%);padding:10px 14px;font-weight:700;"></div>

        <div class="hud-panel" style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);width:min(420px,92vw);padding:10px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="display:flex;gap:6px;align-items:center;font-weight:700;">${ICONS.heart} Health</span>
            <span id="hud-health-text">${player.health}/${player.maxHealth}</span>
          </div>
          <div style="height:12px;background:#efe6da;border-radius:99px;overflow:hidden;">
            <div id="hud-health-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#ef7a67,#e24b3c);"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;font-weight:700;color:#526073;">
            <span id="hud-weapon">Foam Baton</span>
            <span>Dash</span>
          </div>
          <div style="height:6px;background:#efe6da;border-radius:99px;overflow:hidden;margin-top:4px;">
            <div id="hud-dash" style="height:100%;width:100%;background:${accent};"></div>
          </div>
        </div>

        <details id="help-panel" class="hud-panel" style="position:absolute;left:16px;bottom:16px;padding:10px 12px;width:210px;pointer-events:auto;">
          <summary>Controls</summary>
          <div style="margin-top:8px;font-size:13px;line-height:1.55;color:#3c4a5d;">
            WASD move<br>Right-drag look<br>Click attack<br>Space dash<br>E buy building
          </div>
        </details>

        <div id="error-toast" style="position:absolute;top:92px;left:50%;transform:translateX(-50%);background:#e15b4a;color:#fff;padding:0.8rem 1.2rem;border-radius:12px;display:none;font-weight:700;"></div>
      </div>
    `);
    this.hudElement.style.pointerEvents = 'none';
    this.uiLayer.appendChild(this.hudElement);
    const quality = this.hudElement.querySelector('#quality-btn');
    quality?.addEventListener('click', () => {
      const next = quality.textContent === 'Shadows' ? 'low' : 'high';
      this.game.setQuality(next);
      quality.textContent = next === 'low' ? 'Flat' : 'Shadows';
    });
  }

  updateCash(cash: number, income: number): void {
    const cashEl = document.getElementById('hud-cash');
    const incomeEl = document.getElementById('hud-income');
    if (cashEl) cashEl.textContent = String(cash);
    if (incomeEl) incomeEl.textContent = `+${income} / tick`;
  }

  updateSpirit(spirit: number): void {
    const el = document.getElementById('hud-spirit');
    if (el) el.textContent = String(spirit);
  }

  updateHealth(health: number): void {
    const player = this.game.getLocalPlayer();
    if (!player) return;
    
    const textEl = document.getElementById('hud-health-text');
    const barEl = document.getElementById('hud-health-bar');
    
    if (textEl) textEl.textContent = `${health}/${player.maxHealth}`;
    if (barEl) barEl.style.width = `${(health / player.maxHealth) * 100}%`;
  }

  updateRivalryScores(scores: RivalryScore[]): void {
  }

  showKnockout(): void {
    if (this.knockoutOverlay) return;
    
    this.knockoutOverlay = this.createScreen(`
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.7);display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <h1 class="title-font" style="font-size:3rem;color:#e74c3c;margin-bottom:1rem;">KNOCKED OUT!</h1>
        <button id="respawn-btn" style="padding:1rem 3rem;font-size:1.2rem;font-weight:600;border:none;border-radius:8px;background:linear-gradient(135deg,#27ae60,#2ecc71);color:#fff;cursor:pointer;">
          RESPAWN
        </button>
      </div>
    `);
    this.uiLayer.appendChild(this.knockoutOverlay);
    
    const btn = this.knockoutOverlay.querySelector('#respawn-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        this.game.sendRespawn();
      });
    }
  }

  hideKnockout(): void {
    if (this.knockoutOverlay) {
      this.knockoutOverlay.remove();
      this.knockoutOverlay = null;
    }
  }

  showError(message: string): void {
    const toast = document.getElementById('error-toast');
    if (toast) {
      toast.textContent = message;
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 3000);
    }
  }

  private createScreen(html: string): HTMLDivElement {
    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;inset:0;';
    div.innerHTML = html;
    return div;
  }
}
