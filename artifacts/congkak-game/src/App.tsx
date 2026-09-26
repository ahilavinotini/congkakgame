import { type CSSProperties, useState } from 'react';
import {
  ArrowDown,
  ChevronRight,
  CircleHelp,
  Info,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  type GameState,
  type Player,
  newGame,
  playMove,
} from '@/lib/congkak';

const playerNames = ['Player 1', 'Player 2'] as const;
const playerColors = ['saffron', 'coral'] as const;

function PlayerBadge({ player, compact = false }: { player: Player; compact?: boolean }) {
  return (
    <div className={`player-badge player-badge-${playerColors[player]} ${compact ? 'player-badge-compact' : ''}`}>
      <span className="player-badge-dot" aria-hidden="true" />
      <span>{playerNames[player]}</span>
    </div>
  );
}

function SeedCount({ count, large = false, testId }: { count: number; large?: boolean; testId?: string }) {
  return (
    <span className={`seed-count ${large ? 'seed-count-large' : ''}`} data-testid={testId}>
      {count}
    </span>
  );
}

function Store({
  player,
  count,
  isActive,
}: {
  player: Player;
  count: number;
  isActive: boolean;
}) {
  return (
    <div
      className={`store store-${playerColors[player]} ${isActive ? 'store-active' : ''}`}
      data-testid={`card-store-player-${player}`}
    >
      <div className="store-cap">
        <span className="store-label">STORE</span>
        <span className="store-player">{playerNames[player]}</span>
      </div>
      <div className="store-bowl">
        <div className="store-seeds" aria-hidden="true">
          {Array.from({ length: Math.min(count, 16) }).map((_, index) => (
            <i key={index} style={{ '--seed-index': index } as CSSProperties} />
          ))}
          {count > 16 && <span className="store-overflow">+{count - 16}</span>}
        </div>
        <SeedCount count={count} large testId={`text-store-seeds-player-${player}`} />
        <span className="store-seed-label">seeds collected</span>
      </div>
    </div>
  );
}

function Pit({
  player,
  index,
  count,
  isCurrent,
  isLastMove,
  onPlay,
}: {
  player: Player;
  index: number;
  count: number;
  isCurrent: boolean;
  isLastMove: boolean;
  onPlay: () => void;
}) {
  const playable = isCurrent && count > 0;
  return (
    <button
      type="button"
      className={`pit pit-${playerColors[player]} ${playable ? 'pit-playable' : ''} ${isLastMove ? 'pit-last' : ''}`}
      onClick={onPlay}
      disabled={!playable}
      aria-label={`${playerNames[player]} house ${index + 1}, ${count} seeds${playable ? ', choose this house' : ''}`}
      data-testid={`button-pit-player-${player}-${index}`}
    >
      <span className="pit-number">{index + 1}</span>
      <span className="pit-well">
        <span className="pit-glint" aria-hidden="true" />
        <SeedCount count={count} testId={`text-house-seeds-player-${player}-${index}`} />
      </span>
      {playable && <span className="pit-prompt">CHOOSE</span>}
    </button>
  );
}

function GameBoard({ state, onMove }: { state: GameState; onMove: (player: Player, index: number) => void }) {
  const activePlayer = state.status === 'playing' ? state.currentPlayer : null;
  const last = state.lastMove;

  return (
    <section className="board-shell" aria-label="Congkak game board" data-testid="section-game-board">
      <div className="board-ribbon">
        <span className="ribbon-line" />
        <span>Seven houses each</span>
        <span className="ribbon-line" />
      </div>

      <div className="board-player-line board-player-line-top">
        <PlayerBadge player={1} />
        <span className="board-side-note">opposing side</span>
      </div>

      <div className="board-layout">
        <Store player={1} count={state.stores[1]} isActive={activePlayer === 1} />
        <div className="houses-frame">
          <div className="row-label row-label-top">
            <span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
          </div>
          <div className="pits-row pits-row-top" data-testid="row-houses-player-1">
            {state.houses[1].map((_, visibleIndex) => {
              const index = 6 - visibleIndex;
              return (
                <Pit
                  key={`p1-${index}`}
                  player={1}
                  index={index}
                  count={state.houses[1][index]}
                  isCurrent={activePlayer === 1}
                  isLastMove={last?.player === 1 && last.pitIndex === index}
                  onPlay={() => onMove(1, index)}
                />
              );
            })}
          </div>
          <div className="board-divider" aria-hidden="true">
            <span>CONGKAK</span>
          </div>
          <div className="pits-row pits-row-bottom" data-testid="row-houses-player-0">
            {state.houses[0].map((count, index) => (
              <Pit
                key={`p0-${index}`}
                player={0}
                index={index}
                count={count}
                isCurrent={activePlayer === 0}
                isLastMove={last?.player === 0 && last.pitIndex === index}
                onPlay={() => onMove(0, index)}
              />
            ))}
          </div>
          <div className="row-label row-label-bottom">
            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
          </div>
        </div>
        <Store player={0} count={state.stores[0]} isActive={activePlayer === 0} />
      </div>

      <div className="board-player-line board-player-line-bottom">
        <PlayerBadge player={0} />
        <span className="board-side-note">your side</span>
      </div>
    </section>
  );
}

function RulesPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="rules-overlay" role="dialog" aria-modal="true" aria-labelledby="rules-title" data-testid="dialog-rules">
      <div className="rules-modal">
        <div className="rules-modal-topline">
          <span className="eyebrow">A little house-to-house</span>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close rules" data-testid="button-close-rules">
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>
        <h2 id="rules-title">How to play <em>Congkak</em></h2>
        <p className="rules-intro">A quiet, satisfying game of counting, collecting, and reading the board.</p>
        <div className="rules-list">
          <div className="rule-item">
            <span className="rule-number">01</span>
            <div><strong>Pick a house on your side.</strong><span>Choose any house with seeds. The sowing begins with that handful.</span></div>
          </div>
          <div className="rule-item">
            <span className="rule-number">02</span>
            <div><strong>Sow around the board.</strong><span>Drop one seed in each house as you go, including your store. Skip your opponent&apos;s store.</span></div>
          </div>
          <div className="rule-item">
            <span className="rule-number">03</span>
            <div><strong>Keep the rhythm going.</strong><span>If your last seed lands in an occupied house, pick up its seeds and continue.</span></div>
          </div>
          <div className="rule-item">
            <span className="rule-number">04</span>
            <div><strong>Watch where you land.</strong><span>Land in your store and you play again. Land in an empty house on your side to collect that seed and the seeds opposite.</span></div>
          </div>
        </div>
        <div className="rules-note"><Info size={16} /><span>The round ends when one side is empty. The other player collects any seeds left on their side.</span></div>
        <button type="button" className="primary-button rules-done" onClick={onClose} data-testid="button-done-rules">
          Back to the board <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

function FinishedPanel({ state, onNewGame }: { state: GameState; onNewGame: () => void }) {
  const winner = state.stores[0] === state.stores[1] ? null : state.stores[0] > state.stores[1] ? 0 : 1;
  return (
    <div className="finish-card" data-testid="status-game-finished">
      <div className="finish-medallion"><Trophy size={24} strokeWidth={1.5} /></div>
      <span className="eyebrow">Round complete</span>
      <h2>{winner === null ? 'A beautiful tie' : `${playerNames[winner]} takes the round`}</h2>
      <p>{state.message}</p>
      <div className="final-score">
        <div><PlayerBadge player={0} compact /><strong>{state.stores[0]}</strong></div>
        <span>—</span>
        <div><PlayerBadge player={1} compact /><strong>{state.stores[1]}</strong></div>
      </div>
      <button type="button" className="primary-button" onClick={onNewGame} data-testid="button-new-game-finished">
        <RotateCcw size={16} /> Play another round
      </button>
    </div>
  );
}

function App() {
  const [state, setState] = useState<GameState>(() => newGame());
  const [rulesOpen, setRulesOpen] = useState(false);

  const handleMove = (player: Player, pitIndex: number) => {
    try {
      setState((current) => playMove(current, player, pitIndex));
    } catch {
      // The engine guards turn and board validity. A stale click is simply ignored.
    }
  };

  const resetGame = () => setState(newGame());
  const activePlayer = state.currentPlayer;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup" data-testid="text-brand">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><span className="brand-name">SURI</span><span className="brand-subtitle">a congkak table</span></div>
        </div>
        <div className="topbar-actions">
          <span className="round-label"><span className="round-dot" /> Two players · 98 seeds</span>
          <button type="button" className="quiet-button" onClick={() => setRulesOpen(true)} data-testid="button-open-rules">
            <CircleHelp size={17} /> <span>How to play</span>
          </button>
          <button type="button" className="reset-button" onClick={resetGame} data-testid="button-reset-game">
            <RotateCcw size={16} /> <span>New game</span>
          </button>
        </div>
      </header>

      <div className="page-grid">
        <div className="game-column">
          <div className="title-block">
            <span className="eyebrow">The Malaysian seed game</span>
            <h1>Take your time.<br /><em>Count together.</em></h1>
            <p className="title-copy">A shared-screen Congkak table for two. Choose a house, follow the seeds, and leave room for a little luck.</p>
          </div>
          <div className="turn-strip" data-testid="status-turn">
            <div className={`turn-marker turn-marker-${playerColors[activePlayer]}`}><span>{activePlayer + 1}</span></div>
            <div className="turn-copy">
              {state.status === 'finished' ? <><strong>That&apos;s the round.</strong><span>See the final count to the right.</span></> : <><strong>{playerNames[activePlayer]}&apos;s turn</strong><span>{state.message}</span></>}
            </div>
            {state.status === 'playing' && <div className="turn-arrow"><ArrowDown size={18} /></div>}
            <span className="turn-move">MOVE {String(state.moveNumber + 1).padStart(2, '0')}</span>
          </div>
          <GameBoard state={state} onMove={handleMove} />
        </div>

        <aside className="side-column">
          <div className="score-card" data-testid="card-score">
            <div className="score-card-heading"><span className="eyebrow">The tally</span><span className="seed-icon" aria-hidden="true"><Sparkles size={14} /></span></div>
            <div className="score-row">
              <div className="score-player"><PlayerBadge player={0} compact /><span className="score-caption">collected</span></div>
              <strong data-testid="text-score-player-0">{state.stores[0]}</strong>
            </div>
            <div className="score-row">
              <div className="score-player"><PlayerBadge player={1} compact /><span className="score-caption">collected</span></div>
              <strong data-testid="text-score-player-1">{state.stores[1]}</strong>
            </div>
            <div className="score-rule" />
            <p className="score-note">First to gather the most seeds wins the round.</p>
          </div>

          {state.status === 'finished' ? <FinishedPanel state={state} onNewGame={resetGame} /> : (
            <div className="guide-card" data-testid="card-turn-guide">
              <span className="eyebrow">Right now</span>
              <h2>Over to <em>{playerNames[activePlayer].replace(' ', '\n')}</em></h2>
              <p>Tap one of the highlighted houses on the board. The number in each well shows how many seeds are waiting.</p>
              <div className="guide-tip"><span className="tip-mark">i</span><span>Landing in your own store earns you another turn.</span></div>
            </div>
          )}

          <button type="button" className="help-link" onClick={() => setRulesOpen(true)} data-testid="button-open-rules-secondary">
            <span className="help-link-icon"><CircleHelp size={17} /></span>
            <span><strong>New to Congkak?</strong><small>Read the four simple moves</small></span>
            <ChevronRight size={18} />
          </button>
        </aside>
      </div>

      <footer className="footer-note"><span>Made for one table, two players.</span><span className="footer-separator">•</span><span>Malaysia</span></footer>
      {rulesOpen && <RulesPanel onClose={() => setRulesOpen(false)} />}
    </main>
  );
}

export default App;
