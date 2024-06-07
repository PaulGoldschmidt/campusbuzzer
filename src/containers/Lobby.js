import React, { useState } from 'react';
import { Container, Form } from 'react-bootstrap';
import { useLocation, useHistory } from 'react-router-dom';
import { get } from 'lodash';
import { joinRoom, getRoom, createRoom } from '../lib/endpoints';
import Header from '../components/Header';
import Footer, { FooterSimple } from '../components/Footer';

const ERROR_TYPE = {
  emptyCode: 'emptyCode',
  roomCode: 'roomCode',
  name: 'name',
  hostRoom: 'hostRoom',
  fullRoom: 'fullRoom',
  dupName: 'dupName',
};

const ERROR_MESSAGE = {
  [ERROR_TYPE.emptyCode]: 'Bitte gebe ein Raumcode ein',
  [ERROR_TYPE.roomCode]: 'Nicht möglich, dem Raum beizutreten.',
  [ERROR_TYPE.name]: 'Bitte einen Namen eingeben',
  [ERROR_TYPE.dupName]: 'Name bereits verwendet.',
  [ERROR_TYPE.hostRoom]: 'Es ist nicht möglich, den Raum zu erstellen. Bitte probiere es später noch einmal.',
  [ERROR_TYPE.fullRoom]: 'Raum hat seine Kapazität erreicht.',
};

export default function Lobby({ setAuth }) {
  const location = useLocation();
  const prefilledRoomID = get(location, 'state.roomID');

  const history = useHistory();
  const [name, setName] = useState('');
  const [room, setRoom] = useState(prefilledRoomID || '');
  const [joinMode, setJoinMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  console.log('Ein Projekt von Paul Goldschmidt, https://paul-goldschmidt.de - ein Fork des Multibuzzer-Projekts, https://github.com/wsun/multibuzzer/.');
  console.log('Weitere Informationen zum Projekt: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  // enter room: find room, then join it
  async function enterRoom(roomId, hosting = false) {
    if (!hosting) {
      setLoading(true);
    }

    try {
      // get room
      const roomRes = await getRoom(roomId);
      if (roomRes.status !== 200) {
        throw new Error(ERROR_TYPE.roomCode);
      }
      const room = roomRes.data;

      // determine seat to take
      const playerSeat = room.players.find((player) => player.name === name);
      const freeSeat = room.players.find((player) => !player.name);

      if (playerSeat && playerSeat.connected) {
        throw new Error(ERROR_TYPE.dupName);
      }
      if (!playerSeat && !freeSeat) {
        throw new Error(ERROR_TYPE.fullRoom);
      }
      const playerID = get(playerSeat, 'id', get(freeSeat, 'id'));
      const joinRes = await joinRoom(room.roomID, playerID, name);
      if (joinRes.status !== 200) {
        throw new Error(ERROR_TYPE.roomCode);
      }
      const creds = joinRes.data;
      const auth = {
        playerID,
        credentials: creds.playerCredentials,
        roomID: room.roomID,
      };

      // save auth and go to room
      setAuth(auth);
      setLoading(false);
      history.push(`/${room.roomID}`);
    } catch (error) {
      setLoading(false);
      setError(ERROR_MESSAGE[error.message]);
    }
  }

  // make room: create room, then join it
  async function makeRoom() {
    setLoading(true);
    try {
      const createRes = await createRoom();
      if (createRes.status !== 200) {
        throw new Error(ERROR_TYPE.hostRoom);
      }
      const roomID = createRes.data.gameID;
      await enterRoom(roomID, true);
    } catch (error) {
      setLoading(false);
      setError(ERROR_MESSAGE[error.message]);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    // validate room and/or player name has been filled
    if (joinMode) {
      if (room.trim().length === 0) {
        setError(ERROR_MESSAGE[ERROR_TYPE.emptyCode]);
      } else if (name.trim().length === 0) {
        setError(ERROR_MESSAGE[ERROR_TYPE.name]);
      } else if (room.trim().length !== 6) {
        setError(ERROR_MESSAGE[ERROR_TYPE.roomCode]);
      } else {
        enterRoom(room);
      }
    } else {
      if (name.trim().length === 0) {
        setError(ERROR_MESSAGE[ERROR_TYPE.name]);
      } else {
        makeRoom();
      }
    }
  }

  const form = joinMode ? (
    <Form className="lobby-form" onSubmit={(e) => handleSubmit(e)}>
      <h3>Spiel Beitreten</h3>
      <Form.Group controlId="room">
        <Form.Label>Lobby-Code</Form.Label>
        <Form.Control
          value={room}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck="false"
          onChange={(e) => {
            setError('');
            setRoom(e.target.value);
          }}
        />
      </Form.Group>

      <Form.Group controlId="name">
        <Form.Label>Dein Name</Form.Label>
        <Form.Control
          value={name}
          onChange={(e) => {
            setError('');
            setName(e.target.value);
          }}
        />
      </Form.Group>

      <div className="error-message">{error}</div>
      <button type="submit" disabled={loading}>
        {loading ? 'Beitreten...' : 'Beitreten'}
      </button>
      <div className="switcher">
        Eine Lobby Hosten?{' '}
        <button
          className="inline"
          onClick={() => {
            setError('');
            setJoinMode(false);
          }}
        >
          Erstelle eine Lobby!
        </button>
      </div>
    </Form>
  ) : (
    <Form className="lobby-form" onSubmit={(e) => handleSubmit(e)}>
      <h3>Erstelle eine Lobby</h3>
      <Form.Group controlId="name">
        <Form.Label>Dein Name</Form.Label>
        <Form.Control
          value={name}
          onChange={(e) => {
            setError('');
            setName(e.target.value);
          }}
        />
      </Form.Group>

      <div className="error-message">{error}</div>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Host'}
      </button>
      <div className="switcher">
        Lobby schon erstellt?{' '}
        <button
          className="inline"
          onClick={() => {
            setError('');
            setJoinMode(true);
          }}
        >
          Lobby beitreten!
        </button>
      </div>
    </Form>
  );

  const touts = (
    <div className="touts">
      <div>
        <h4>Kleines Buzzer-System</h4>
        <p>Erstelle eine Lobby und hoste bis zu 200 Teilnehmer:innen</p>
      </div>
      <div>
        <h4>Beitritt mit jedem Gerät</h4>
        <p>
          Tritt vom Computer, Smartphone, Nintendo 3DS, LG Smart Fridge und co. bei und spiele mit!
        </p>
      </div>
      <div>
        <h4>Gratis!</h4>
        <p>
          Und das alles für den niedrigen Preis von 0 Euro.
        </p>
      </div>
      <div>
        <h4>Von euch für euch</h4>
        <p>
          Diese Seite entstand innerhalb des ELPJ-1 2024 für das Jeopardy-Projekt.
        </p>
      </div>
    </div>
  );

  return (
    <main id="lobby">
      <section className="primary d-none d-md-flex">
        <div id="lobby-left">
          <div>
            <Header />
            <section className="container-half">{touts}</section>
          </div>
          <section className="container-half">
            <FooterSimple />
          </section>
        </div>
        <div id="lobby-right">
          <section className="container-half">{form}</section>
        </div>
      </section>
      <section className="primary d-block d-md-none">
        <Header />
        <Container className="container-mobile">{form}</Container>
        <div className="divider" />
        <Container className="container-mobile">{touts}</Container>
      </section>
      <Footer mobileOnly />
    </main>
  );
}
