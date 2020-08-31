import { execSync } from 'child_process';
import express from 'express';
import env from './env';

const app = express();

app.use(express.json());

app.get('/players', (req, res) => {
  let players: Player[];
  try {
    players = getPlayers();
  } catch (error) {
    res.status(500).send();
    return;
  }

  res.status(200).json({ players });
});

app.post('/', (req, res) => {
  const { action }: { action: unknown } = req.body;

  if (!isValidAction(action)) {
    res.status(400).send();
    return;
  }

  try {
    takeAction(action);
  } catch (error) {
    res.status(500).send();
    return;
  }

  res.status(200).send();
});

app.listen(env.get('PORT'));

type Player = {
  name: string;
};

function getPlayers(): Player[] {
  // Result is of the form:
  // There are 1 of a max of 20 players online: [comma-separated list of names]
  const result = interact('list');

  const names = result.split(':')[1].trim();

  if (names === '') {
    return [];
  }

  const players = names.split(',').map((name) => ({
    name: name.trim(),
  }));

  return players;
}

const PERMITTED_ACTIONS = ['start', 'stop', 'reboot'] as const;

type PermittedAction = typeof PERMITTED_ACTIONS[number];

type ActionHandler = () => void;

const actionHandlers: Record<PermittedAction, ActionHandler> = {
  start: handleStart,
  stop: handleStop,
  reboot: handleReboot,
};

function isValidAction(action: unknown): action is PermittedAction {
  if (typeof action !== 'string') {
    return false;
  }

  return PERMITTED_ACTIONS.some(
    (permittedAction) => permittedAction.toLowerCase() === action.toLowerCase(),
  );
}

function takeAction(action: PermittedAction): void {
  actionHandlers[action]();
}

function interact(command: string): string {
  const buffer = execSync(
    `docker exec mc rcon-cli --password ${env.get(
      'RCON_PASSWORD',
    )} '${command}'`,
  );

  return buffer.toString();
}

function say(text: string): void {
  interact(`/say ${text}`);
}

function handleStart() {
  execSync('docker start mc');
}

function handleStop() {
  say('The server is shutting down in 1 minute.');
  execSync('sleep 30');
  say('The server is shutting down in 30 seconds.');
  execSync('sleep 30');
  execSync('docker stop mc');
}

function handleReboot() {
  say('The server is restarting in 1 minute.');
  execSync('sleep 30');
  say('The server is restarting in 30 seconds.');
  execSync('sleep 30');
  execSync('docker restart mc');
}
