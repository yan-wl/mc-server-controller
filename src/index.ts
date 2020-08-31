import { execSync } from 'child_process';
import express from 'express';
import env from './env';

const app = express();

app.use(express.json());

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

function handleStart() {
  execSync('docker start mc');
}

function handleStop() {
  execSync(
    `docker exec mc rcon-cli --password ${env.get(
      'RCON_PASSWORD',
    )} '/say The server is shutting down in 1 minute.'`,
  );
  execSync('sleep 60');
  execSync('docker stop mc');
}

function handleReboot() {
  execSync('docker restart mc');
}
