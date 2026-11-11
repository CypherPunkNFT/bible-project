// The shared games kit (REDESIGN-BRIEF section 5): behaviour several games share, named from the audits' README. It
// carries behaviour, not look: a game sets --kit-color, --kit-right, --kit-wrong, --kit-part, --kit-surface,
// --kit-radius and --kit-ease on its root and imports "./kit.css" once; the pieces move, tint and settle in that look.
// The kit imports no game. Each piece and its users: src/pages/games/README.md ("Kit") and docs/visual-audits/KIT.md.
import "./kit.css";

export { hasWindow, prefersReducedMotion, motionMs, KIT_EASE } from "./env";
export { AnswerCard, type AnswerCardProps, type AnswerState } from "./AnswerCard";
export { FlipCard, type FlipCardProps, type FlipTone } from "./FlipCard";
export { FeedbackBand, type FeedbackBandProps } from "./FeedbackBand";
export { useScrollTopOn } from "./scroll";
export { ProgressTrail, type ProgressTrailProps } from "./ProgressTrail";
export { trailText, trailMarks, newestIndex, DEFAULT_SQUARES, type TrailMark, type TrailSquares } from "./trail";
export { ScoreCountUp, type ScoreCountUpProps } from "./ScoreCountUp";
export { useCountUp, countAt, easeOut } from "./count-up";
export { ResultPanel, RankLine, NewBestRibbon, type ResultPanelProps, type RankLineProps } from "./ResultPanel";
export { rankFor, type Rank } from "./rank";
export { StreakFlame, type StreakFlameProps } from "./StreakFlame";
export { useGrew } from "./grew";
export { ShareButton, type ShareButtonProps } from "./ShareButton";
export { shareText, type ShareOutcome } from "./share";
export { TimerBar, type TimerBarProps } from "./TimerBar";
export { timerTone, timeShare, type TimerTone } from "./timer";
export { TeamChips, WinnerLine, HandOver, type Team, type TeamChipsProps, type WinnerLineProps, type HandOverProps } from "./TeamChips";
export { Podium, type PodiumProps } from "./Podium";
export { placeTeams, podiumSteps, scoreShares, teamTone, TEAM_TONES, type Scored, type Placed } from "./teams";
export { HopWave, Confetti, type HopWaveProps, type ConfettiProps } from "./Celebration";
export { confettiPieces, seeded, type ConfettiPiece } from "./confetti";
export { MoreOptions, type MoreOptionsProps } from "./MoreOptions";
export { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";
