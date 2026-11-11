import type { Game } from '../game/Game';
import type { SchoolId, CampusState, RivalryScore } from '@campus-rivals/shared';
import { SCHOOLS, PLOTS, BUILDINGS } from '@campus-rivals/shared';

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

  update(dt: number): void {
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

    this.hudElement = this.createScreen(`
      <div id="hud" style="pointer-events:none;">
        <!-- Top Bar -->
        <div style="position:absolute;top:1rem;left:50%;transform:translateX(-50%);display:flex;gap:2rem;background:rgba(0,0,0,0.6);padding:0.75rem 2rem;border-radius:12px;">
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <span style="color:#f1c40f;">💰</span>
            <span id="hud-cash" style="color:#fff;font-weight:600;">${player.cash}</span>
            <span id="hud-income" style="color:#888;font-size:0.8rem;">(+0/s)</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <span style="color:#9b59b6;">⭐</span>
            <span id="hud-spirit" style="color:#fff;font-weight:600;">${player.spirit}</span>
          </div>
        </div>

        <!-- Health Bar -->
        <div style="position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);width:300px;">
          <div style="background:rgba(0,0,0,0.6);border-radius:8px;padding:0.5rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
              <span style="color:#fff;font-size:0.8rem;">Health</span>
              <span id="hud-health-text" style="color:#fff;font-size:0.8rem;">${player.health}/${player.maxHealth}</span>
            </div>
            <div style="height:12px;background:#333;border-radius:6px;overflow:hidden;">
              <div id="hud-health-bar" style="height:100%;background:linear-gradient(90deg,#e74c3c,#c0392b);width:100%;transition:width 0.3s;"></div>
            </div>
          </div>
        </div>

        <!-- School Badge -->
        ${school ? `
        <div style="position:absolute;top:1rem;left:1rem;display:flex;align-items:center;gap:0.75rem;background:rgba(0,0,0,0.6);padding:0.5rem 1rem;border-radius:8px;">
          <div style="width:30px;height:30px;background:${school.color};border-radius:50%;"></div>
          <span style="color:#fff;font-weight:500;">${school.shortName}</span>
        </div>
        ` : ''}

        <!-- Controls Help -->
        <div style="position:absolute;bottom:1rem;left:1rem;background:rgba(0,0,0,0.6);padding:0.75rem;border-radius:8px;font-size:0.75rem;color:#888;">
          <div>WASD - Move</div>
          <div>Mouse - Look</div>
          <div>LMB - Attack</div>
          <div>Space - Dash</div>
          <div>E/F - Interact</div>
        </div>

        <!-- Error Toast -->
        <div id="error-toast" style="position:absolute;top:5rem;left:50%;transform:translateX(-50%);background:#e74c3c;color:#fff;padding:1rem 2rem;border-radius:8px;display:none;"></div>
      </div>
    `);
    this.uiLayer.appendChild(this.hudElement);
  }

  updateCash(cash: number, income: number): void {
    const cashEl = document.getElementById('hud-cash');
    const incomeEl = document.getElementById('hud-income');
    if (cashEl) cashEl.textContent = String(cash);
    if (incomeEl) incomeEl.textContent = `(+${income}/s)`;
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
