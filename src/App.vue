<template>
	<div class="tongits-app">
		<!-- Portrait warning -->
		<div class="orientation-lock">
			<div class="orientation-card">
				<div class="orientation-icon">↻</div>
				<h2>Rotate your device</h2>
				<p
					>Tong-its is designed for landscape mode.</p
				>
			</div>
		</div>

		<!-- SETUP -->
		<div
			v-if="gameState === 'setup'"
			class="setup-screen">
			<div class="setup-panel">
				<div class="setup-brand">
					<div class="brand-chip">🃏</div>
					<div>
						<div class="setup-title">TONG-ITS</div>
					</div>
				</div>
				<p class="setup-copy"
					>Choose the number of players</p
				>
				<div class="player-name-section">
					<label for="playerName"> Player Name </label>

					<input
						id="playerName"
						v-model.trim="playerName"
						type="text"
						maxlength="20"
						placeholder="Enter your player name"
						autocomplete="off" />

					<small v-if="!playerName">
						Player name is required.
					</small>
				</div>

				<div
					v-if="setupPlayers === 2 && isOnline"
					class="online-room-panel">
					<div class="online-title">
						ONLINE 2-PLAYER GAME
					</div>

					<button
						class="action-btn blue-btn"
						:disabled="!playerName"
						@click="createOnlineRoom">
						CREATE ROOM
					</button>

					<div class="room-divider"> OR </div>

					<input
						v-model.trim="joinRoomCode"
						class="room-code-input"
						maxlength="6"
						placeholder="ROOM CODE"
						@input="
							joinRoomCode = joinRoomCode
								.toUpperCase()
								.replace(/[^A-Z0-9]/g, '')
						" />

					<button
						class="action-btn blue-btn"
						:disabled="
							!playerName || joinRoomCode.length !== 6
						"
						@click="joinOnlineRoom">
						JOIN ROOM
					</button>

					<div
						v-if="roomCode"
						class="room-created">
						<span>ROOM CODE</span>

						<strong>
							{{ roomCode }}
						</strong>

						<small>
							Waiting for another player...
						</small>
					</div>
				</div>
				<div class="player-options">
					<button
						v-for="option in playerOptions"
						:key="option.value"
						class="player-option"
						:class="{
							active: setupPlayers === option.value,
							disabled: option.value === 2 && !isOnline,
						}"
						:disabled="option.value === 2 && !isOnline"
						@click="setupPlayers = option.value">
						<strong>
							{{ option.value }}
						</strong>

						<span>
							{{ option.label }}
						</span>

						<small
							v-if="option.value === 2 && !isOnline">
							Online only
						</small>
					</button>
				</div>
				<div
					class="connection-status"
					:class="{
						online: isOnline,
						offline: !isOnline,
					}">
					<span class="status-dot"></span>

					{{ isOnline ? "Online" : "Offline" }}
				</div>
				<label class="bot-toggle">
					<input
						v-model="botEnabled"
						type="checkbox"
						:disabled="setupPlayers !== 1" />
					<span>
						Play against Bot
						<small v-if="setupPlayers !== 1"
							>Available in 1-player mode</small
						>
					</span>
				</label>
				<div class="random-note"
					>🎲 First player is randomized every
					game.</div
				>
				<button
					v-if="setupPlayers === 1"
					class="action-btn blue-btn start-button"
					:disabled="!playerName"
					@click="startGame">
					START GAME
				</button>
			</div>
		</div>

		<!-- RULES -->
		<div
			v-if="showRules"
			class="modal-backdrop"
			@click.self="showRules = false">
			<div class="rules-panel">
				<button
					class="modal-close"
					@click="showRules = false"
					>×</button
				>
				<div class="modal-kicker">GAME GUIDE</div>
				<h2>How to Play Tong-its</h2>
				<div class="rules-grid">
					<div>
						<h3>Objective</h3>
						<p
							>Get rid of all your cards by forming valid
							melds, or finish with the lowest remaining
							hand value.</p
						>
					</div>
					<div>
						<h3>Opening</h3>
						<p
							>The first player is randomly selected
							every new game. The starter receives 13
							cards and discards first.</p
						>
					</div>
					<div>
						<h3>Set</h3>
						<div class="rule-cards">
							<span class="mini-card">7♠</span>
							<span class="mini-card red">7♥</span>
							<span class="mini-card red">7♦</span>
						</div>
						<p>Three or four cards of the same rank.</p>
					</div>
					<div>
						<h3>Run</h3>
						<div class="rule-cards">
							<span class="mini-card">4♣</span>
							<span class="mini-card">5♣</span>
							<span class="mini-card">6♣</span>
						</div>
						<p
							>Three or more consecutive cards of the
							same suit.</p
						>
					</div>
					<div>
						<h3>Turn</h3>
						<ol>
							<li>Draw from the deck or discard.</li>
							<li>Create valid melds.</li>
							<li>Add cards to existing melds.</li>
							<li>Discard one card.</li>
						</ol>
					</div>
					<div>
						<h3>Winning</h3>
						<ul>
							<li
								><strong>Tong-its:</strong> Empty your
								hand.</li
							>
							<li
								><strong>Lowest Hand:</strong> Finish with
								the lowest remaining card value.</li
							>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- GAME -->
		<main
			v-if="gameState !== 'setup'"
			class="game-shell">
			<!-- HUD Top Bar -->
			<header class="top-bar">
				<button
					class="green-circle-btn"
					@click="newGame"
					aria-label="Back">
					<span class="back-arrow">←</span>
				</button>

				<div class="hud-right">
					<button
						class="green-circle-btn"
						@click="showRules = true"
						aria-label="Rules">
						<span class="menu-icon">≡</span>
					</button>
				</div>
			</header>

			<!-- GAME BOARD -->
			<section class="game-board">
				<!-- OPPONENTS (Left & Right) -->
				<div class="opponents-container">
					<div
						v-for="(player, idx) in opponents"
						:key="player.id"
						class="opponent-seat"
						:class="[
							'opponent-pos-' + idx,
							{ active: player.id === currentPlayerId },
						]">
						<div class="opponent-cards-graphic">
							<div class="opponent-card-back"></div>
							<div class="card-count-badge">{{
								player.hand.length
							}}</div>
						</div>

						<div class="opponent-profile">
							<div class="profile-avatar">{{
								player.isBot ? "🤖" : "👤"
							}}</div>
							<div class="profile-info">
								<div class="profile-name">{{
									player.name
								}}</div>
								<div class="profile-chips">11M 💰</div>
							</div>
						</div>
					</div>
				</div>

				<!-- CENTER PLAY AREA -->
				<div class="center-play-area">
					<!-- Left Meld Box (Visual placeholder based on design) -->
					<div class="meld-box left-meld-box">
						<div class="meld-scroll-area">
							<div
								v-for="player in players"
								:key="`meld-player-${player.id}`"
								v-show="
									player.melds.length &&
									player.id !== currentPlayerId
								">
								<div class="meld-list">
									<div
										v-for="(
											meld, meldIndex
										) in player.melds"
										:key="`meld-${player.id}-${meldIndex}`"
										class="meld-group"
										:class="{
											selected: isMeldTargetSelected(
												player.id,
												meldIndex,
											),
										}"
										@click="
											selectMeldTarget(player.id, meldIndex)
										">
										<div
											v-for="card in meld"
											:key="card.id"
											class="meld-card"
											:class="cardColor(card)">
											<b>{{ card.rank }}</b>
											<span>{{ card.suit }}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Draw & Discard Piles -->
					<div class="piles-container">
						<div class="table-zone draw-zone">
							<button
								class="pile-card deck-card"
								:class="{
									drawing: animationType === 'draw',
								}"
								:disabled="!canDrawDeck"
								@click="drawFromDeck">
								<div class="deck-pattern"></div>
								<div class="deck-count-badge">{{
									deck.length
								}}</div>
							</button>
						</div>

						<div class="table-zone discard-zone">
							<div
								v-if="!discardPile.length"
								class="empty-discard"></div>
							<div
								v-else
								class="discard-track">
								<button
									class="pile-card game-card discard-card"
									:class="[cardColor(topDiscard)]"
									:disabled="!canDrawDiscard"
									@click="
										onlineMode
											? onlineDrawDiscard()
											: drawFromDiscard()
									">
									<span class="card-corner top">
										<b>{{ topDiscard.rank }}</b>
										<i>{{ topDiscard.suit }}</i>
									</span>
									<span class="card-suit-large">{{
										topDiscard.suit
									}}</span>
									<span class="card-corner bottom">
										<b>{{ topDiscard.rank }}</b>
										<i>{{ topDiscard.suit }}</i>
									</span>
								</button>
							</div>
						</div>
					</div>

					<!-- Right Meld Box -->
					<div class="meld-box right-meld-box">
						<div class="meld-scroll-area">
							<div
								v-for="player in players"
								:key="`meld-player-${player.id}`"
								v-show="
									player.melds.length &&
									player.id === currentPlayerId
								">
								<div class="meld-list">
									<div
										v-for="(
											meld, meldIndex
										) in player.melds"
										:key="`meld-${player.id}-${meldIndex}`"
										class="meld-group"
										:class="{
											selected: isMeldTargetSelected(
												player.id,
												meldIndex,
											),
										}"
										@click="
											selectMeldTarget(player.id, meldIndex)
										">
										<div
											v-for="card in meld"
											:key="card.id"
											class="meld-card"
											:class="cardColor(card)">
											<b>{{ card.rank }}</b>
											<span>{{ card.suit }}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="watermark">TONG-ITS</div>

				<!-- PLAYER MESSAGE / BOT THINKING -->
				<div class="center-messages">
					<Transition name="message">
						<div
							v-if="message"
							class="game-message"
							:class="`message-${messageType}`">
							{{ message }}
						</div>
					</Transition>
					<div
						v-if="currentPlayer?.isBot"
						class="bot-thinking">
						🤖 {{ currentPlayer.name }} is thinking...
					</div>
					<div
						v-if="isOpeningDiscard"
						class="bot-thinking">
						🎲 Make the opening discard.
					</div>
				</div>

				<!-- ACTION BUTTONS -->
				<div
					class="action-buttons-row"
					v-if="
						currentPlayer && (!onlineMode || isMyTurn)
					">
					<button
						class="action-btn blue-btn"
						:disabled="!canCreateMeld && !canAddToMeld"
						@click="
							onlineMode
								? onlineMeld()
								: canCreateMeld
									? createSelectedMeld()
									: addSelectedToMeld()
						">
						MELD
					</button>

					<button
						v-if="turnPhase === 'draw'"
						class="action-btn blue-btn"
						:disabled="!canDrawDeck"
						@click="
							onlineMode
								? onlineDrawDeck()
								: drawFromDeck()
						">
						DRAW
					</button>

					<button
						v-if="turnPhase === 'discard'"
						class="action-btn blue-btn"
						:disabled="!canSortHand"
						@click="sortCurrentHand">
						SORT
					</button>

					<button
						class="action-btn blue-btn"
						:disabled="
							selectedCards.length !== 1 ||
							turnPhase !== 'discard'
						"
						@click="
							onlineMode
								? onlineDiscard()
								: discardSelected()
						">
						DISCARD
					</button>

					<button
						v-if="canUndoDiscardTake"
						class="action-btn red-btn"
						@click="
							onlineMode
								? socket.emit('game:undo-discard')
								: undoDiscardTake()
						">
						UNDO
					</button>
				</div>

				<!-- BOTTOM PLAYER AREA -->
				<section
					class="player-bottom-area"
					v-if="myPlayer && !myPlayer.isBot">
					<div class="player-profile-dock">
						<div class="profile-avatar">👤</div>
						<div class="profile-info-box">
							<div class="profile-name">{{
								myPlayer.name
							}}</div>
							<div class="profile-chips">11.3T 💰</div>
						</div>
					</div>

					<div class="hand-rail">
						<div class="hand-scroll">
							<div
								v-for="(card, index) in sortedCurrentHand"
								:key="card.id"
								class="hand-card-wrapper"
								:class="{
									selected: isSelected(card),
									playable: turnPhase === 'discard',
								}"
								@click="toggleCardSelection(card)">
								<div
									class="game-card hand-card"
									:class="[
										cardColor(card),
										{ arrive: isCardRecentlyDrawn(card) },
									]">
									<span class="card-corner top">
										<b>{{ card.rank }}</b>
										<i>{{ card.suit }}</i>
									</span>
									<span class="card-suit-large">{{
										card.suit
									}}</span>
									<span class="card-corner bottom">
										<b>{{ card.rank }}</b>
										<i>{{ card.suit }}</i>
									</span>
								</div>
								<!-- Green bar for selected cards mimicking the 'meld group' UI in the reference -->
								<div
									v-if="isSelected(card)"
									class="selected-green-bar"></div>
							</div>
						</div>

						<!-- Points overlapping hand center -->
						<div class="hand-points-badge">
							<span>POINT</span>
							<strong>{{
								handValue(myPlayer.hand)
							}}</strong>
						</div>
					</div>
				</section>
			</section>
		</main>

		<!-- GAME OVER -->
		<Transition name="modal">
			<div
				v-if="gameState === 'finished'"
				class="modal-backdrop game-over-backdrop">
				<div class="game-over-panel">
					<div class="winner-icon">{{
						winner?.isBot ? "🤖" : "🏆"
					}}</div>
					<div class="modal-kicker"
						>ROUND COMPLETE</div
					>
					<h2>{{ winner?.name }} Wins!</h2>
					<p>{{ winReason }}</p>

					<div class="scoreboard">
						<div
							v-for="player in sortedPlayersByScore"
							:key="player.id"
							class="score-row">
							<span>{{
								player.isBot ? "🤖" : "👤"
							}}</span>
							<strong>{{ player.name }}</strong>
							<small
								>{{ player.hand.length }} cards</small
							>
							<b>{{ handValue(player.hand) }}</b>
						</div>
					</div>

					<button
						class="action-btn blue-btn"
						style="width: 100%"
						@click="newGame"
						>PLAY AGAIN</button
					>
				</div>
			</div>
		</Transition>

		<!-- SPECIAL EFFECT -->
		<Transition name="effect">
			<div
				v-if="specialEffect"
				class="special-effect">
				<span>{{ specialEffect }}</span>
			</div>
		</Transition>
	</div>
</template>

<script setup>
	import { io } from "socket.io-client";
	import {
		computed,
		nextTick,
		ref,
		watch,
	} from "vue";

	const SOCKET_URL =
		import.meta.env.VITE_SOCKET_URL ||
		"http://localhost:3001";

	const socket = io(SOCKET_URL, {
		autoConnect: true,
	});

	const isOnline = ref(false);
	const onlineMode = ref(false);

	const playerName = ref("");

	const roomCode = ref("");
	const joinRoomCode = ref("");

	const myPlayerId = ref(null);

	const onlineState = ref(null);

	/*
	|--------------------------------------------------------------------------
	| CONSTANTS
	|--------------------------------------------------------------------------
	*/

	const SUITS = [
		{ symbol: "♠", name: "Spades", color: "black" },
		{ symbol: "♥", name: "Hearts", color: "red" },
		{ symbol: "♦", name: "Diamonds", color: "red" },
		{ symbol: "♣", name: "Clubs", color: "black" },
	];

	const RANKS = [
		{ value: 1, label: "A" },
		{ value: 2, label: "2" },
		{ value: 3, label: "3" },
		{ value: 4, label: "4" },
		{ value: 5, label: "5" },
		{ value: 6, label: "6" },
		{ value: 7, label: "7" },
		{ value: 8, label: "8" },
		{ value: 9, label: "9" },
		{ value: 10, label: "10" },
		{ value: 11, label: "J" },
		{ value: 12, label: "Q" },
		{ value: 13, label: "K" },
	];

	/*
	|--------------------------------------------------------------------------
	| STATE
	|--------------------------------------------------------------------------
	*/

	const gameState = ref("setup");
	const setupPlayers = ref(2);
	const botEnabled = ref(true);
	const players = ref([]);
	const deck = ref([]);
	const discardPile = ref([]);
	const currentPlayerIndex = ref(0);
	const turnPhase = ref("discard");
	const selectedCards = ref([]);
	const selectedMeldTarget = ref(null);
	const roundNumber = ref(1);
	const message = ref("");
	const messageType = ref("info");
	const showRules = ref(false);
	const winner = ref(null);
	const winReason = ref("");
	const animationType = ref("");
	const specialEffect = ref("");
	const recentlyDrawnCardIds = ref([]);
	const lastTakenDiscardId = ref(null);
	let messageTimer = null;
	let effectTimer = null;

	const playerOptions = [
		{ value: 1, label: "1 Player" },
		{ value: 2, label: "2 Players" },
	];

	/*
	|--------------------------------------------------------------------------
	| COMPUTED
	|--------------------------------------------------------------------------
	*/

	const currentPlayerId = computed(
		() => currentPlayer.value?.id ?? null,
	);
	const visibleDiscardPile = computed(
		() => discardPile.value,
	);

	const canUndoDiscardTake = computed(() => {
		return (
			gameState.value === "playing" &&
			turnPhase.value === "discard" &&
			!!currentPlayer.value &&
			!currentPlayer.value.isBot &&
			lastTakenDiscardId.value !== null &&
			currentPlayer.value.hand.some(
				(card) =>
					card.id === lastTakenDiscardId.value,
			)
		);
	});

	const opponents = computed(() => {
		const myId = onlineMode.value
			? myPlayerId.value
			: currentPlayerId.value;

		return players.value.filter(
			(player) => player.id !== myId,
		);
	});
	const hasAnyMelds = computed(() => {
		return players.value.some(
			(player) =>
				player.melds && player.melds.length > 0,
		);
	});

	const topDiscard = computed(() => {
		return (
			discardPile.value[
				discardPile.value.length - 1
			] || null
		);
	});

	const cardSortComparator = (a, b) => {
		if (a.rankValue !== b.rankValue) {
			return a.rankValue - b.rankValue;
		}
		return a.suitIndex - b.suitIndex;
	};

	const sortedCurrentHand = computed(() => {
		const player = onlineMode.value
			? myPlayer.value
			: currentPlayer.value;

		if (!player) {
			return [];
		}

		return [...player.hand].sort(
			cardSortComparator,
		);
	});

	const isMyTurn = computed(() => {
		if (!onlineMode.value) {
			return true;
		}

		return (
			!!myPlayer.value &&
			!!onlineState.value &&
			onlineState.value.currentPlayerId ===
				myPlayer.value.id
		);
	});

	const canSortHand = computed(() => {
		return (
			gameState.value === "playing" &&
			!!currentPlayer.value &&
			!currentPlayer.value.isBot &&
			currentPlayer.value.hand.length > 0
		);
	});

	function sortCurrentHand() {
		if (!canSortHand.value || !currentPlayer.value)
			return;
		currentPlayer.value.hand.sort(
			cardSortComparator,
		);
	}

	const canDrawDeck = computed(() => {
		return (
			gameState.value === "playing" &&
			(!onlineMode.value || isMyTurn.value) &&
			turnPhase.value === "draw" &&
			!!currentPlayer.value &&
			!currentPlayer.value.isBot &&
			deck.value.length > 0
		);
	});

	const canDrawDiscard = computed(() => {
		return (
			gameState.value === "playing" &&
			(!onlineMode.value || isMyTurn.value) &&
			turnPhase.value === "draw" &&
			!!currentPlayer.value &&
			!currentPlayer.value.isBot &&
			!!topDiscard.value &&
			canUseDiscardCard(topDiscard.value)
		);
	});

	const canCreateMeld = computed(() => {
		if (selectedCards.value.length < 3)
			return false;
		return isValidMeld(getSelectedCardObjects());
	});

	const canUseDiscardCard = (card) => {
		if (
			!card ||
			!currentPlayer.value ||
			currentPlayer.value.isBot
		)
			return false;
		if (
			currentPlayer.value.melds.some((meld) =>
				canAddCardToMeld(card, meld),
			)
		)
			return true;
		const hand = currentPlayer.value.hand;
		for (let i = 0; i < hand.length; i++) {
			for (let j = i + 1; j < hand.length; j++) {
				if (isValidMeld([card, hand[i], hand[j]]))
					return true;
			}
		}
		return false;
	};

	const canAddToMeld = computed(() => {
		if (
			!currentPlayer.value ||
			selectedCards.value.length !== 1 ||
			!selectedMeldTarget.value
		)
			return false;
		const card = getSelectedCardObjects()[0];
		if (!card) return false;
		const targetMeld = getSelectedMeld();
		if (!targetMeld) return false;
		return canAddCardToMeld(card, targetMeld);
	});

	const sortedPlayersByScore = computed(() => {
		return [...players.value].sort(
			(a, b) =>
				handValue(a.hand) - handValue(b.hand),
		);
	});

	const isOpeningDiscard = computed(() => {
		return (
			gameState.value === "playing" &&
			turnPhase.value === "discard" &&
			discardPile.value.length === 0
		);
	});

	/*
	|--------------------------------------------------------------------------
	| GAME INITIALIZATION
	|--------------------------------------------------------------------------
	*/

	function createOnlineRoom() {
		if (!playerName.value) {
			showMessage(
				"Player name is required.",
				"warning",
			);

			return;
		}

		if (!isOnline.value) {
			showMessage(
				"You must be online for 2-player mode.",
				"warning",
			);

			return;
		}

		onlineMode.value = true;

		socket.emit("room:create", {
			playerName: playerName.value,
		});
	}

	function startGame() {
		if (!playerName.value) {
			showMessage(
				"Player name is required.",
				"warning",
			);

			return;
		}

		/*
    |--------------------------------------------------------------------------
    | 2 PLAYER = ONLINE ONLY
    |--------------------------------------------------------------------------
    */

		if (setupPlayers.value === 2) {
			if (!isOnline.value) {
				showMessage(
					"2-player mode requires an online connection.",
					"warning",
				);

				return;
			}

			createOnlineRoom();

			return;
		}

		/*
    |--------------------------------------------------------------------------
    | 1 PLAYER = LOCAL
    |--------------------------------------------------------------------------
    */

		onlineMode.value = false;

		initializePlayers();

		/*
    |--------------------------------------------------------------------------
    | Use player's entered name
    |--------------------------------------------------------------------------
    */

		players.value[0].name = playerName.value;

		createAndShuffleDeck();

		/*
    |--------------------------------------------------------------------------
    | RANDOMIZE STARTER BEFORE DEALING
    |--------------------------------------------------------------------------
    */

		const randomStarter = Math.floor(
			Math.random() * players.value.length,
		);

		currentPlayerIndex.value = randomStarter;

		dealCards();

		gameState.value = "playing";

		turnPhase.value = "discard";

		roundNumber.value = 1;

		selectedCards.value = [];

		winner.value = null;

		winReason.value = "";

		animationType.value = "";

		recentlyDrawnCardIds.value = [];

		showMessage(
			`🎲 ${currentPlayer.value.name} starts and must discard first.`,
			"success",
		);

		showSpecialEffect(
			`🎲 ${currentPlayer.value.name}`,
		);

		if (!onlineMode.value) {
			nextTick(() => {
				processBotTurn();
			});
		}
	}

	function newGame() {
		gameState.value = "setup";
		players.value = [];
		deck.value = [];
		discardPile.value = [];
		selectedCards.value = [];
		winner.value = null;
		winReason.value = "";
		message.value = "";
		turnPhase.value = "discard";
		animationType.value = "";
		specialEffect.value = "";
		recentlyDrawnCardIds.value = [];
	}

	function initializePlayers() {
		const result = [];

		if (setupPlayers.value === 1) {
			result.push({
				id: 1,
				name: playerName.value || "Newbie123",
				hand: [],
				melds: [],
				isBot: false,
			});

			if (botEnabled.value) {
				result.push({
					id: 2,
					name: "MikeStorm",
					hand: [],
					melds: [],
					isBot: true,
				});
			}
		}

		players.value = result;
	}

	const currentPlayer = computed(
		() =>
			players.value[currentPlayerIndex.value] ||
			null,
	);
	const myPlayer = computed(() => {
		if (!onlineMode.value) {
			return currentPlayer.value;
		}

		return (
			players.value.find(
				(player) => player.id === myPlayerId.value,
			) || null
		);
	});

	/*
	|--------------------------------------------------------------------------
	| DECK & DEALING
	|--------------------------------------------------------------------------
	*/

	function createDeck() {
		const cards = [];
		let id = 1;
		SUITS.forEach((suit, suitIndex) => {
			RANKS.forEach((rank) => {
				cards.push({
					id: id++,
					suit: suit.symbol,
					suitName: suit.name,
					suitIndex,
					rank: rank.label,
					rankValue: rank.value,
				});
			});
		});
		return cards;
	}

	function createAndShuffleDeck() {
		deck.value = shuffle(createDeck());
		discardPile.value = [];
	}

	function shuffle(array) {
		const result = [...array];
		for (let i = result.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[result[i], result[j]] = [
				result[j],
				result[i],
			];
		}
		return result;
	}

	function dealCards() {
		const starterIndex = currentPlayerIndex.value;

		players.value.forEach((player) => {
			player.hand = [];
			player.melds = [];
		});

		for (let round = 0; round < 12; round++) {
			for (
				let i = 0;
				i < players.value.length;
				i++
			) {
				drawCardToPlayer(players.value[i]);
			}
		}

		drawCardToPlayer(players.value[starterIndex]);

		discardPile.value = [];
	}

	function connectSocket() {
		if (socket.connected) {
			isOnline.value = true;
			return;
		}

		socket.connect();
	}

	socket.on("connect", () => {
		isOnline.value = true;

		console.log("Socket connected:", socket.id);
	});

	socket.on("disconnect", () => {
		isOnline.value = false;

		if (onlineMode.value) {
			showMessage(
				"Connection to the game server was lost.",
				"warning",
			);
		}
	});

	socket.on("connect_error", () => {
		isOnline.value = false;
	});

	function joinOnlineRoom() {
		if (!playerName.value) {
			showMessage(
				"Player name is required.",
				"warning",
			);

			return;
		}

		if (!joinRoomCode.value) {
			showMessage("Enter a room code.", "warning");

			return;
		}

		if (!isOnline.value) {
			showMessage(
				"You must be online for 2-player mode.",
				"warning",
			);

			return;
		}

		onlineMode.value = true;

		socket.emit("room:join", {
			roomCode: joinRoomCode.value,
			playerName: playerName.value,
		});
	}

	socket.on(
		"room:created",
		({ roomCode: code, playerId }) => {
			roomCode.value = code;
			myPlayerId.value = Number(playerId);
			showMessage(
				`Room ${code} created. Waiting for another player...`,
				"success",
			);
		},
	);

	socket.on(
		"room:joined",
		({ roomCode: code, playerId }) => {
			roomCode.value = code;
			myPlayerId.value = Number(playerId);
			showMessage(`Joined room ${code}.`, "success");
		},
	);

	socket.on("game:state", (state) => {
		if (!onlineMode.value || !state) return;

		onlineState.value = state;
		players.value = Array.isArray(state.players)
			? state.players.map((player) => ({
					...player,
					hand: Array.isArray(player.hand)
						? player.hand
						: [],
					melds: Array.isArray(player.melds)
						? player.melds
						: [],
					points: Number.isFinite(
						Number(player.points),
					)
						? Number(player.points)
						: 0,
				}))
			: [];

		discardPile.value = Array.isArray(
			state.discardPile,
		)
			? state.discardPile
			: [];
		currentPlayerIndex.value = Number.isInteger(
			state.currentPlayerIndex,
		)
			? state.currentPlayerIndex
			: 0;
		turnPhase.value = state.turnPhase || "draw";
		winner.value = state.winner || null;
		winReason.value = state.winReason || "";

		gameState.value =
			state.status === "finished"
				? "finished"
				: state.status === "playing"
					? "playing"
					: "setup";

		// The backend intentionally sends only the deck count.
		deck.value = Array.from(
			{
				length: Math.max(
					0,
					Number(state.deckCount) || 0,
				),
			},
			(_, index) => ({ id: `server-card-${index}` }),
		);

		selectedCards.value = [];
		selectedMeldTarget.value = null;
	});

	socket.on(
		"game:message",
		({ text, type = "info" }) => {
			showMessage(text, type);
		},
	);

	socket.on(
		"game:error",
		({ message: errorMessage }) => {
			showMessage(
				errorMessage || "Game action failed.",
				"warning",
			);
		},
	);

	function drawCardToPlayer(player) {
		const card = deck.value.pop();
		if (card) player.hand.push(card);
	}

	/*
	|--------------------------------------------------------------------------
	| DRAW / PLAY LOGIC
	|--------------------------------------------------------------------------
	*/

	function drawFromDeck() {
		if (!canDrawDeck.value) return;
		const card = deck.value.pop();
		if (!card) {
			showMessage(
				"The draw pile is empty.",
				"warning",
			);
			return;
		}
		currentPlayer.value.hand.push(card);
		recentlyDrawnCardIds.value = [card.id];
		animationType.value = "draw";
		turnPhase.value = "discard";
		showMessage(
			`${currentPlayer.value.name} drew a card.`,
			"info",
		);
		clearAnimationLater();
	}

	function drawFromDiscard() {
		if (!canDrawDiscard.value) return;
		const card = discardPile.value.pop();
		if (!card) return;
		currentPlayer.value.hand.push(card);
		recentlyDrawnCardIds.value = [card.id];
		lastTakenDiscardId.value = card.id;
		animationType.value = "take-discard";
		turnPhase.value = "discard";
		showMessage(
			`${currentPlayer.value.name} took the discard.`,
			"info",
		);
		clearAnimationLater();
	}

	function undoDiscardTake() {
		if (!canUndoDiscardTake.value) return;
		const cardIndex =
			currentPlayer.value.hand.findIndex(
				(card) =>
					card.id === lastTakenDiscardId.value,
			);
		if (cardIndex === -1) {
			lastTakenDiscardId.value = null;
			return;
		}
		const [card] = currentPlayer.value.hand.splice(
			cardIndex,
			1,
		);
		discardPile.value.push(card);
		lastTakenDiscardId.value = null;
		selectedCards.value = [];
		recentlyDrawnCardIds.value = [];
		turnPhase.value = "draw";
		animationType.value = "undo";
		clearAnimationLater();
	}

	function toggleCardSelection(card) {
		if (
			turnPhase.value !== "discard" ||
			!currentPlayer.value ||
			currentPlayer.value.isBot
		)
			return;
		const index = selectedCards.value.indexOf(
			card.id,
		);
		if (index >= 0) {
			selectedCards.value.splice(index, 1);
		} else {
			selectedCards.value.push(card.id);
		}
		animationType.value = "select";
		clearAnimationLater();
	}

	function isSelected(card) {
		return selectedCards.value.includes(card.id);
	}

	function getSelectedCardObjects() {
		if (!currentPlayer.value) return [];
		return currentPlayer.value.hand.filter((card) =>
			selectedCards.value.includes(card.id),
		);
	}

	function getSelectedMeld() {
		if (!selectedMeldTarget.value) return null;
		const player = players.value.find(
			(player) =>
				player.id ===
				selectedMeldTarget.value.playerId,
		);
		return (
			player?.melds?.[
				selectedMeldTarget.value.meldIndex
			] || null
		);
	}

	function selectMeldTarget(playerId, meldIndex) {
		if (
			!currentPlayer.value ||
			currentPlayer.value.isBot
		)
			return;
		const existing = selectedMeldTarget.value;
		if (
			existing &&
			existing.playerId === playerId &&
			existing.meldIndex === meldIndex
		) {
			selectedMeldTarget.value = null;
			return;
		}
		selectedMeldTarget.value = {
			playerId,
			meldIndex,
		};
	}

	function isMeldTargetSelected(
		playerId,
		meldIndex,
	) {
		return (
			selectedMeldTarget.value &&
			selectedMeldTarget.value.playerId ===
				playerId &&
			selectedMeldTarget.value.meldIndex ===
				meldIndex
		);
	}

	function isCardRecentlyDrawn(card) {
		return recentlyDrawnCardIds.value.includes(
			card.id,
		);
	}

	function isValidMeld(cards) {
		if (!cards || cards.length < 3) return false;
		return isValidSet(cards) || isValidRun(cards);
	}

	function isValidSet(cards) {
		if (cards.length < 3 || cards.length > 4)
			return false;
		const rank = cards[0].rankValue;
		const suits = new Set(
			cards.map((card) => card.suit),
		);
		return (
			cards.every(
				(card) => card.rankValue === rank,
			) && suits.size === cards.length
		);
	}

	function isValidRun(cards) {
		if (cards.length < 3) return false;
		const suit = cards[0].suit;
		if (!cards.every((card) => card.suit === suit))
			return false;
		const values = cards
			.map((card) => card.rankValue)
			.sort((a, b) => a - b);
		const unique = [...new Set(values)];
		if (unique.length !== cards.length)
			return false;
		for (let i = 1; i < unique.length; i++) {
			if (unique[i] !== unique[i - 1] + 1)
				return false;
		}
		return true;
	}

	function createSelectedMeld() {
		if (!canCreateMeld.value) {
			showMessage(
				"Selected cards do not form a valid meld.",
				"warning",
			);
			return;
		}
		const cards = getSelectedCardObjects();
		if (
			lastTakenDiscardId.value !== null &&
			cards.some(
				(card) =>
					card.id === lastTakenDiscardId.value,
			)
		) {
			lastTakenDiscardId.value = null;
		}
		removeCardsFromHand(cards);
		currentPlayer.value.melds.push(cards);
		selectedCards.value = [];
		animationType.value = "meld";
		checkTongits();
		clearAnimationLater();
	}

	function addSelectedToMeld() {
		if (!canAddToMeld.value) return;
		const card = getSelectedCardObjects()[0];
		if (
			lastTakenDiscardId.value !== null &&
			card.id === lastTakenDiscardId.value
		) {
			lastTakenDiscardId.value = null;
		}
		const player = players.value.find(
			(player) =>
				player.id ===
				selectedMeldTarget.value.playerId,
		);
		const meldIndex =
			selectedMeldTarget.value.meldIndex;
		const targetMeld = player?.melds?.[meldIndex];
		if (!targetMeld) return;
		targetMeld.push(card);
		removeCardsFromHand([card]);
		selectedCards.value = [];
		checkTongits();
		clearAnimationLater();
	}

	function canAddCardToMeld(card, meld) {
		if (!meld || !meld.length) return false;
		if (
			meld.length < 4 &&
			meld.every(
				(existing) =>
					existing.rankValue === meld[0].rankValue,
			) &&
			card.rankValue === meld[0].rankValue
		) {
			const alreadyExists = meld.some(
				(existing) => existing.suit === card.suit,
			);
			return !alreadyExists;
		}
		if (
			meld.every(
				(existing) => existing.suit === meld[0].suit,
			) &&
			card.suit === meld[0].suit
		) {
			const values = meld
				.map((existing) => existing.rankValue)
				.concat(card.rankValue)
				.sort((a, b) => a - b);
			const unique = [...new Set(values)];
			if (unique.length !== values.length)
				return false;
			for (let i = 1; i < unique.length; i++) {
				if (unique[i] !== unique[i - 1] + 1)
					return false;
			}
			return true;
		}
		return false;
	}
	function onlineDrawDiscard() {
		if (!onlineMode.value || !isMyTurn.value)
			return;
		socket.emit("game:draw-discard");
	}

	function onlineMeld() {
		if (!onlineMode.value || !isMyTurn.value)
			return;

		if (canCreateMeld.value) {
			socket.emit("game:create-meld", {
				cardIds: [...selectedCards.value],
			});
			return;
		}

		if (
			canAddToMeld.value &&
			selectedMeldTarget.value
		) {
			socket.emit("game:add-to-meld", {
				cardId: selectedCards.value[0],
				targetPlayerId:
					selectedMeldTarget.value.playerId,
				meldIndex: selectedMeldTarget.value.meldIndex,
			});
		}
	}

	function onlineDrawDeck() {
		if (!onlineMode.value) {
			return;
		}

		socket.emit("game:draw-deck");
	}

	function onlineDiscard() {
		if (
			!onlineMode.value ||
			selectedCards.value.length !== 1
		) {
			return;
		}

		const cardId = selectedCards.value[0];
		if (cardId == null) return;

		socket.emit("game:discard", { cardId });
	}

	function discardSelected() {
		if (
			!currentPlayer.value ||
			currentPlayer.value.isBot ||
			selectedCards.value.length !== 1 ||
			turnPhase.value !== "discard"
		)
			return;
		if (lastTakenDiscardId.value !== null) {
			showMessage(
				"You must meld the taken discard before discarding.",
				"warning",
			);
			return;
		}
		const card = getSelectedCardObjects()[0];
		if (!card) return;
		removeCardsFromHand([card]);
		discardPile.value.push(card);
		selectedCards.value = [];
		lastTakenDiscardId.value = null;
		animationType.value = "discard";
		if (checkTongits()) return;
		clearAnimationLater();
		endTurn();
	}

	function removeCardsFromHand(cards) {
		const ids = new Set(
			cards.map((card) => card.id),
		);
		currentPlayer.value.hand =
			currentPlayer.value.hand.filter(
				(card) => !ids.has(card.id),
			);
	}

	function endTurn() {
		if (gameState.value !== "playing") return;
		selectedCards.value = [];
		recentlyDrawnCardIds.value = [];
		lastTakenDiscardId.value = null;
		currentPlayerIndex.value =
			(currentPlayerIndex.value + 1) %
			players.value.length;
		turnPhase.value = "draw";
		roundNumber.value++;
		nextTick(() => {
			processBotTurn();
		});
	}

	function checkTongits() {
		if (
			currentPlayer.value &&
			currentPlayer.value.hand.length === 0
		) {
			finishTongits();
			return true;
		}
		return false;
	}

	function finishTongits() {
		if (!currentPlayer.value) return;
		winner.value = currentPlayer.value;
		winReason.value = `${currentPlayer.value.name} successfully got rid of all cards.`;
		gameState.value = "finished";
		showSpecialEffect("🏆 TONG-ITS!");
	}

	function cardValue(card) {
		if (!card) return 0;
		const rankValue = Number(card.rankValue);
		if (!Number.isFinite(rankValue)) return 0;
		return rankValue >= 10 ? 10 : rankValue;
	}

	function handValue(hand) {
		if (!Array.isArray(hand)) return 0;
		return hand.reduce(
			(total, card) => total + cardValue(card),
			0,
		);
	}

	/* BOT LOGIC (Simplified for brevity, unchanged core logic) */
	async function processBotTurn() {
		if (onlineMode.value) {
			return;
		}

		if (
			gameState.value !== "playing" ||
			!currentPlayer.value?.isBot
		)
			return;
		await delay(700);
		if (
			gameState.value !== "playing" ||
			!currentPlayer.value?.isBot
		)
			return;
		if (
			turnPhase.value === "discard" &&
			discardPile.value.length === 0
		) {
			botOpeningDiscard();
			return;
		}
		if (turnPhase.value !== "draw") return;
		botDraw();
		await delay(600);
		if (
			gameState.value !== "playing" ||
			!currentPlayer.value?.isBot
		)
			return;
		botPlayMelds();
		await delay(500);
		if (
			gameState.value !== "playing" ||
			!currentPlayer.value?.isBot
		)
			return;
		botDiscard();
	}

	function botOpeningDiscard() {
		const bot = currentPlayer.value;
		const discard = chooseBotDiscard(bot);
		if (!discard) return;
		removeCardsFromBotHand(bot, [discard]);
		discardPile.value.push(discard);
		if (bot.hand.length === 0) {
			finishTongits();
			return;
		}
		endTurn();
	}

	function botDraw() {
		const bot = currentPlayer.value;
		const discard = topDiscard.value;
		if (
			discard &&
			botShouldTakeDiscard(bot, discard)
		) {
			const card = discardPile.value.pop();
			bot.hand.push(card);
			turnPhase.value = "discard";
			return;
		}
		const card = deck.value.pop();
		if (card) {
			bot.hand.push(card);
			turnPhase.value = "discard";
		}
	}

	function botShouldTakeDiscard(bot, card) {
		const sameRank = bot.hand.filter(
			(existing) =>
				existing.rankValue === card.rankValue,
		);
		if (sameRank.length >= 2) return true;
		const sameSuit = bot.hand
			.filter(
				(existing) => existing.suit === card.suit,
			)
			.map((existing) => existing.rankValue);
		if (
			sameSuit.includes(card.rankValue - 1) ||
			sameSuit.includes(card.rankValue + 1)
		)
			return true;
		return false;
	}

	function botPlayMelds() {
		const bot = currentPlayer.value;
		let changed = true;
		while (changed) {
			changed = false;
			const byRank = {};
			bot.hand.forEach((card) => {
				if (!byRank[card.rankValue])
					byRank[card.rankValue] = [];
				byRank[card.rankValue].push(card);
			});
			for (const rank of Object.keys(byRank)) {
				const cards = byRank[rank];
				if (cards.length >= 3) {
					const meld = cards.slice(0, 4);
					removeCardsFromBotHand(bot, meld);
					bot.melds.push(meld);
					changed = true;
					break;
				}
			}
			if (changed) continue;
			for (const suit of SUITS) {
				const suitCards = bot.hand
					.filter((card) => card.suit === suit.symbol)
					.sort((a, b) => a.rankValue - b.rankValue);
				const run = findRun(suitCards);
				if (run.length >= 3) {
					removeCardsFromBotHand(bot, run);
					bot.melds.push(run);
					changed = true;
					break;
				}
			}
		}
		let added = true;
		while (added) {
			added = false;
			for (const card of [...bot.hand]) {
				const meldIndex = bot.melds.findIndex(
					(meld) => canAddCardToMeld(card, meld),
				);
				if (meldIndex !== -1) {
					bot.melds[meldIndex].push(card);
					removeCardsFromBotHand(bot, [card]);
					added = true;
					break;
				}
			}
		}
		if (bot.hand.length === 0) finishTongits();
	}

	function removeCardsFromBotHand(bot, cards) {
		const ids = new Set(
			cards.map((card) => card.id),
		);
		bot.hand = bot.hand.filter(
			(card) => !ids.has(card.id),
		);
	}

	function findRun(cards) {
		if (cards.length < 3) return [];
		let best = [];
		for (
			let start = 0;
			start < cards.length;
			start++
		) {
			const run = [cards[start]];
			for (
				let i = start + 1;
				i < cards.length;
				i++
			) {
				const previous = run[run.length - 1];
				if (
					cards[i].rankValue ===
					previous.rankValue + 1
				) {
					run.push(cards[i]);
				} else if (
					cards[i].rankValue >
					previous.rankValue + 1
				) {
					break;
				}
			}
			if (run.length > best.length) best = run;
		}
		return best;
	}

	function chooseBotDiscard(bot) {
		if (!bot?.hand?.length) return null;
		const scored = bot.hand.map((card) => {
			let score = cardValue(card);
			const neighbors = bot.hand.filter(
				(other) =>
					other.id !== card.id &&
					other.suit === card.suit &&
					Math.abs(other.rankValue - card.rankValue) <=
						2,
			);
			const sameRank = bot.hand.filter(
				(other) =>
					other.id !== card.id &&
					other.rankValue === card.rankValue,
			);
			score -= neighbors.length * 3;
			score -= sameRank.length * 4;
			return { card, score };
		});
		scored.sort((a, b) => b.score - a.score);
		return scored[0]?.card || null;
	}

	function botDiscard() {
		const bot = currentPlayer.value;
		const discard = chooseBotDiscard(bot);
		if (!discard) return;
		removeCardsFromBotHand(bot, [discard]);
		discardPile.value.push(discard);
		if (bot.hand.length === 0) {
			finishTongits();
			return;
		}
		endTurn();
	}

	/* UI HELPERS */
	function cardColor(card) {
		if (!card) return "";
		return card.suit === "♥" || card.suit === "♦"
			? "text-red"
			: "text-black";
	}

	function showMessage(text, type = "info") {
		message.value = text;
		messageType.value = type;
		if (messageTimer) clearTimeout(messageTimer);
		messageTimer = setTimeout(() => {
			message.value = "";
		}, 2800);
	}

	function showSpecialEffect(text) {
		specialEffect.value = text;
		if (effectTimer) clearTimeout(effectTimer);
		effectTimer = setTimeout(() => {
			specialEffect.value = "";
		}, 850);
	}

	function clearAnimationLater() {
		setTimeout(() => {
			animationType.value = "";
			recentlyDrawnCardIds.value = [];
		}, 600);
	}

	function delay(ms) {
		return new Promise((resolve) =>
			setTimeout(resolve, ms),
		);
	}
</script>

<style scoped>
	:global(html),
	:global(body),
	:global(#app) {
		margin: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	:global(body) {
		background: #020b66; /* Deep solid blue from screenshot */
		font-family: Arial, Helvetica, sans-serif;
	}

	* {
		box-sizing: border-box;
	}

	button {
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
		font: inherit;
		border: none;
		outline: none;
		cursor: pointer;
	}

	.tongits-app {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		overflow: hidden;
		color: white;
		background: #06087d; /* Main solid blue bg */
		user-select: none;
	}

	.text-red {
		color: #d52b2b;
	}
	.text-black {
		color: #151515;
	}

	/* =========================
	   ORIENTATION LOCK
	========================= */
	.orientation-lock {
		display: none;
	}
	@media (orientation: portrait) {
		.orientation-lock {
			position: fixed;
			z-index: 9999;
			inset: 0;
			display: grid;
			place-items: center;
			padding: 24px;
			background: #020b66;
		}
		.orientation-card {
			width: min(320px, 100%);
			padding: 26px 20px;
			border: 2px solid #2389a9;
			border-radius: 22px;
			background: #102a5c;
			text-align: center;
		}
		.orientation-icon {
			margin-bottom: 12px;
			color: #ffe064;
			font-size: 48px;
			animation: rotateHint 1.8s ease-in-out infinite;
		}
		.orientation-card h2 {
			margin: 0;
			font-size: 21px;
			font-weight: bold;
		}
		.orientation-card p {
			margin: 7px 0 0;
			color: rgba(255, 255, 255, 0.7);
			font-size: 12px;
		}
	}
	@keyframes rotateHint {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(90deg);
		}
	}

	/* =========================
	   MODALS (SETUP & RULES & GAME OVER)
	========================= */
	.setup-screen,
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: grid;
		place-items: center;
		padding: 16px;
		background: rgba(2, 11, 102, 0.85);
		backdrop-filter: blur(4px);
	}

	.setup-panel,
	.rules-panel,
	.game-over-panel {
		width: min(430px, 100%);
		max-height: min(calc(100vh - 32px), 720px);
		padding: 24px;
		border: 3px solid #2389a9;
		border-radius: 16px;
		background: #0a1f4a;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 16px;
		overflow: hidden;
	}

	.setup-panel {
		overflow-y: auto;
		overflow-x: hidden;
	}

	@media (max-width: 420px) {
		.setup-panel {
			padding: 16px;
		}
		.player-options {
			grid-template-columns: repeat(2, 1fr);
			gap: 8px;
		}
		.setup-title {
			font-size: 24px;
		}
		.setup-copy {
			font-size: 13px;
		}
		.action-btn {
			width: 100%;
			padding: 10px 16px;
		}
	}
	.rules-panel {
		width: min(720px, 100%);
		max-height: min(calc(100vh - 32px), 720px);
		overflow: auto;
	}

	.modal-close {
		position: absolute;
		top: 12px;
		right: 12px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #d52b2b;
		color: white;
		font-size: 24px;
		font-weight: bold;
		border: 2px solid white;
	}

	.setup-brand {
		text-align: center;
		margin-bottom: 20px;
	}
	.brand-chip {
		font-size: 40px;
	}
	.setup-title {
		color: #fff;
		font-size: 28px;
		font-weight: bold;
		margin-top: 10px;
	}
	.setup-copy {
		text-align: center;
		margin-bottom: 15px;
		color: #ccc;
		font-size: 14px;
	}

	.player-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-bottom: 15px;
	}
	.player-option {
		background: #11346e;
		border: 2px solid #2389a9;
		border-radius: 10px;
		padding: 15px 5px;
		color: white;
		transition: 0.2s;
	}
	.player-option.active {
		background: #1a4f9e;
		border-color: #3edc8f;
		box-shadow: 0 0 10px rgba(62, 220, 143, 0.5);
	}
	.player-option strong {
		display: block;
		font-size: 20px;
		color: #ffcc00;
	}
	.player-option span {
		font-size: 11px;
		opacity: 0.8;
	}

	.bot-toggle {
		display: block;
		text-align: center;
		margin-bottom: 15px;
		font-size: 14px;
	}
	.random-note {
		text-align: center;
		font-size: 11px;
		color: #aaa;
		margin-bottom: 20px;
	}

	.scoreboard {
		margin: 15px 0;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 10px;
		padding: 10px;
	}
	.score-row {
		display: flex;
		justify-content: space-between;
		padding: 8px;
		border-bottom: 1px solid
			rgba(255, 255, 255, 0.1);
	}

	.rules-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.rules-grid > div {
		background: rgba(0, 0, 0, 0.2);
		padding: 10px;
		border-radius: 8px;
	}
	.rule-cards {
		display: flex;
		gap: 5px;
	}
	.mini-card {
		background: white;
		color: black;
		padding: 2px 6px;
		border-radius: 3px;
		font-weight: bold;
		font-family: serif;
	}
	.mini-card.red {
		color: #d52b2b;
	}

	/* =========================
	   GAME SHELL & HUD
	========================= */
	.game-shell {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.top-bar {
		position: relative;
		z-index: 20;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 20px;
		height: 60px;
	}

	.green-circle-btn {
		width: 45px;
		height: 45px;
		background: #3edc8f; /* Bright green */
		border-radius: 50%;
		display: grid;
		place-items: center;
		box-shadow: 0 4px 0 #1b8a53; /* 3D bottom edge */
		font-size: 24px;
		color: white;
		font-weight: bold;
	}
	.green-circle-btn:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 #1b8a53;
	}

	.hud-center {
		flex: 1;
		display: flex;
		justify-content: center;
	}
	.pot-label {
		color: #fff;
		font-size: 14px;
		font-weight: bold;
	}
	.pot-amount {
		color: #ffcc00;
		font-size: 18px;
		font-weight: bold;
		text-shadow: 0 1px 2px #000;
	}

	.hud-right {
		display: flex;
		align-items: center;
		gap: 15px;
	}

	/* =========================
	   GAME BOARD
	========================= */
	.game-board {
		position: relative;
		flex: 1;
		width: 100%;
		overflow: hidden;
	}

	/* OPPONENTS */
	.opponents-container {
		position: absolute;
		top: 10%;
		left: 0;
		right: 0;
		pointer-events: none;
	}
	.opponent-seat {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}
	.opponent-pos-0 {
		left: 4%;
	}
	.opponent-pos-1 {
		right: 4%;
	}

	.opponent-cards-graphic {
		position: relative;
	}
	.opponent-card-back {
		width: 50px;
		height: 70px;
		background: #d52b2b;
		border: 3px solid white;
		border-radius: 5px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
		position: relative;
	}
	.opponent-card-back::after {
		content: "";
		position: absolute;
		inset: 4px;
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: 2px;
		background: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 4px,
			rgba(255, 255, 255, 0.1) 4px,
			rgba(255, 255, 255, 0.1) 8px
		);
	}
	.card-count-badge {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		color: #1b8a53;
		border: 2px solid #3edc8f;
		border-radius: 50%;
		width: 26px;
		height: 26px;
		display: grid;
		place-items: center;
		font-size: 12px;
		font-weight: bold;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
	}

	.opponent-profile {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.profile-avatar {
		width: 40px;
		height: 40px;
		background: #e6b981;
		border: 2px solid white;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 20px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
	}
	.profile-info {
		text-align: center;
		margin-top: 2px;
	}
	.profile-name {
		color: white;
		font-size: 11px;
		font-weight: bold;
		text-shadow: 1px 1px 1px #000;
	}
	.profile-chips {
		color: #ddd;
		font-size: 10px;
		font-weight: bold;
	}

	/* CENTER PLAY AREA */
	.center-play-area {
		position: absolute;
		top: 5%;
		left: 15%;
		right: 15%;
		height: 44%;
		display: flex;
		justify-content: center;
		gap: 15px;
		z-index: 5;
	}

	.meld-box {
		flex: 1;
		max-width: 280px;
		background: #00004d; /* Dark navy empty box */
		border-radius: 4px;
		position: relative;
		overflow: hidden;
	}
	.meld-scroll-area {
		position: absolute;
		inset: 0;
		padding: 5px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 5px;
		align-items: flex-start;
	}

	.piles-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		background: #11345e;
		border: 4px solid #2389a9;
		border-radius: 8px;
		padding: 10px 15px;
		width: 180px;
	}

	.pile-card {
		width: 55px;
		height: 78px;
		border-radius: 6px;
		position: relative;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}
	.deck-card {
		background: #d52b2b;
		border: 3px solid white;
	}
	.deck-card::after {
		content: "";
		position: absolute;
		inset: 3px;
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: 2px;
		background: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 4px,
			rgba(255, 255, 255, 0.1) 4px,
			rgba(255, 255, 255, 0.1) 8px
		);
	}
	.deck-count-badge {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 2;
		background: white;
		color: #1b8a53;
		border: 2px solid #3edc8f;
		border-radius: 50%;
		width: 26px;
		height: 26px;
		display: grid;
		place-items: center;
		font-size: 12px;
		font-weight: bold;
	}

	.empty-discard {
		width: 55px;
		height: 78px;
		border: 2px dashed rgba(255, 255, 255, 0.2);
		border-radius: 6px;
	}

	/* Game Card Styles */
	.game-card {
		background: white;
		border: 1px solid #ccc;
		font-family: Georgia, serif;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.card-corner {
		position: absolute;
		line-height: 0.9;
		text-align: center;
		display: flex;
		flex-direction: column;
	}
	.card-corner.top {
		top: 3px;
		left: 3px;
	}
	.card-corner.bottom {
		bottom: 3px;
		right: 3px;
		transform: rotate(180deg);
	}
	.card-corner b {
		font-size: 12px;
	}
	.card-corner i {
		font-size: 11px;
		font-style: normal;
		margin-top: -1px;
	}
	.card-suit-large {
		font-size: 28px;
	}

	/* Melds in Boxes */
	.meld-list {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	.meld-group {
		display: flex;
		background: transparent;
		padding: 2px;
		border-radius: 4px;
		transition: 0.2s;
	}
	.meld-group.selected {
		background: rgba(255, 204, 0, 0.3);
		outline: 2px solid #ffcc00;
	}
	.meld-card {
		width: 30px;
		height: 42px;
		background: white;
		border: 1px solid #999;
		border-radius: 3px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-family: Georgia, serif;
		font-size: 11px;
		line-height: 1;
		margin-left: -10px;
		box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
	}
	.meld-card:first-child {
		margin-left: 0;
	}
	.meld-card b {
		font-size: 10px;
	}
	.meld-card span {
		font-size: 12px;
	}

	/* WATERMARK */
	.watermark {
		position: absolute;
		top: 60%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 40px;
		font-weight: 900;
		font-style: italic;
		letter-spacing: 2px;
		color: rgba(255, 255, 255, 0.05);
		pointer-events: none;
		z-index: 1;
	}

	/* ACTION BUTTONS */
	.action-buttons-row {
		position: absolute;
		bottom: 35%;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		justify-content: center;
		gap: 15px;
		z-index: 15;
	}
	.action-btn {
		font-weight: 900;
		font-size: 14px;
		letter-spacing: 0.5px;
		padding: 8px 24px;
		border-radius: 6px;
		color: white;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
		transition: transform 0.1s;
	}
	.action-btn:active:not(:disabled) {
		transform: translateY(2px);
	}
	.action-btn:disabled {
		opacity: 0.5;
		filter: grayscale(1);
		cursor: not-allowed;
	}

	.blue-btn {
		background: linear-gradient(
			to bottom,
			#1d4b85,
			#0c2b5e
		);
		border: 2px solid #1a3c7a;
		border-bottom: 4px solid #4a90e2; /* light blue lip */
	}
	.red-btn {
		background: linear-gradient(
			to bottom,
			#d53a3a,
			#991a1a
		);
		border: 2px solid #7a1515;
		border-bottom: 4px solid #ff6b6b;
	}

	/* BOTTOM PLAYER AREA */
	.player-bottom-area {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 25%;
		display: flex;
		align-items: flex-end;
		padding-bottom: 10px;
		z-index: 10;
	}

	.player-profile-dock {
		position: absolute;
		left: 15px;
		bottom: 15px;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.player-profile-dock .profile-avatar {
		width: 50px;
		height: 50px;
		font-size: 26px;
	}
	.player-profile-dock .profile-info-box {
		background: rgba(0, 0, 0, 0.6);
		padding: 4px 10px;
		border-radius: 6px;
	}
	.player-profile-dock .profile-name {
		font-size: 12px;
	}
	.player-profile-dock .profile-chips {
		font-size: 12px;
		color: #ffcc00;
	}

	.hand-rail {
		flex: 1;
		display: flex;
		justify-content: center;
		position: relative;
	}
	.hand-scroll {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 20px 0 0;
	}
	.hand-card-wrapper {
		position: relative;
		margin-left: -20px;
		transition: transform 0.2s;
	}
	.hand-card-wrapper:first-child {
		margin-left: 0;
	}
	.hand-card-wrapper.playable:hover {
		transform: translateY(-10px);
		z-index: 30;
	}
	.hand-card-wrapper.selected {
		transform: translateY(-15px);
		z-index: 40;
	}

	.hand-card {
		width: 65px;
		height: 95px;
		border-radius: 6px;
		box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
	}
	.hand-card-wrapper.selected .hand-card {
		box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
	}

	.selected-green-bar {
		position: absolute;
		bottom: -4px;
		left: 5px;
		right: 5px;
		height: 8px;
		background: #3edc8f;
		border-radius: 4px;
		z-index: 41;
	}

	.hand-points-badge {
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		background: #222;
		border: 2px solid #444;
		border-radius: 4px;
		padding: 2px 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: white;
		z-index: 50;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
	}
	.hand-points-badge span {
		font-size: 8px;
		font-weight: bold;
		letter-spacing: 1px;
		color: #aaa;
	}
	.hand-points-badge strong {
		font-size: 14px;
	}

	/* MESSAGES & EFFECTS */
	.center-messages {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 50;
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: center;
		pointer-events: none;
	}
	.game-message {
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: bold;
		text-align: center;
		border: 1px solid #555;
	}
	.message-success {
		border-color: #3edc8f;
		color: #3edc8f;
	}
	.message-warning {
		border-color: #ffcc00;
		color: #ffcc00;
	}
	.bot-thinking {
		background: rgba(0, 0, 0, 0.6);
		color: #ddd;
		padding: 6px 12px;
		border-radius: 12px;
		font-size: 11px;
	}

	.special-effect {
		position: fixed;
		inset: 0;
		z-index: 4000;
		display: grid;
		place-items: center;
		pointer-events: none;
	}
	.special-effect span {
		background: rgba(0, 0, 0, 0.6);
		color: #ffcc00;
		padding: 15px 30px;
		border-radius: 10px;
		font-size: 36px;
		font-weight: 900;
		text-shadow: 0 4px 10px black;
		border: 2px solid #ffcc00;
	}

	/* ANIMATIONS */
	@keyframes cardDraw {
		0% {
			transform: translateY(15px) scale(0.9);
			opacity: 0;
		}
		100% {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}
	@keyframes cardArrive {
		0% {
			transform: translateY(-30px);
			opacity: 0;
		}
		100% {
			transform: translateY(0);
			opacity: 1;
		}
	}
	@keyframes effectPop {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		20% {
			transform: scale(1.2);
			opacity: 1;
		}
		80% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.1);
			opacity: 0;
		}
	}

	.deck-card.drawing {
		animation: cardDraw 0.4s ease-out;
	}
	.hand-card.arrive {
		animation: cardArrive 0.4s ease-out;
	}
	.effect-enter-active {
		animation: effectPop 0.8s ease-out;
	}

	.message-enter-active,
	.message-leave-active {
		transition:
			opacity 0.2s,
			transform 0.2s;
	}
	.message-enter-from,
	.message-leave-to {
		opacity: 0;
		transform: scale(0.9);
	}

	.modal-enter-active,
	.modal-leave-active {
		transition: opacity 0.2s;
	}
	.modal-enter-from,
	.modal-leave-to {
		opacity: 0;
	}

	/* RESPONSIVE SCALING */
	@media (max-width: 700px) and (orientation: landscape) {
		.top-bar {
			padding: 5px 10px;
			height: 50px;
		}
		.green-circle-btn {
			width: 36px;
			height: 36px;
			font-size: 18px;
		}
		.pot-container {
			padding: 4px 20px;
		}
		.pot-label {
			font-size: 12px;
		}
		.pot-amount {
			font-size: 14px;
		}

		.opponent-card-back {
			width: 40px;
			height: 56px;
		}
		.card-count-badge {
			width: 22px;
			height: 22px;
			font-size: 10px;
		}
		.profile-avatar {
			width: 32px;
			height: 32px;
			font-size: 16px;
		}

		.piles-container {
			padding: 6px 10px;
			width: 140px;
		}
		.pile-card,
		.empty-discard {
			width: 45px;
			height: 64px;
		}
		.deck-count-badge {
			width: 22px;
			height: 22px;
			font-size: 10px;
		}
		.card-suit-large {
			font-size: 22px;
		}
		.card-corner b {
			font-size: 10px;
		}

		.action-buttons-row {
			bottom: 28%;
			gap: 10px;
		}
		.action-btn {
			padding: 6px 16px;
			font-size: 11px;
		}

		.hand-card {
			width: 50px;
			height: 74px;
		}
		.hand-card-wrapper {
			margin-left: -15px;
		}
		.player-profile-dock {
			left: 10px;
			bottom: 10px;
		}
		.player-profile-dock .profile-avatar {
			width: 40px;
			height: 40px;
			font-size: 20px;
		}
	}

	.player-name-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 14px;
	}

	.player-name-section label {
		color: #fff;
		font-size: 12px;
		font-weight: bold;
		text-transform: uppercase;
	}

	.player-name-section input,
	.room-code-input {
		width: 100%;
		padding: 12px 14px;
		border: 2px solid #2389a9;
		border-radius: 8px;
		background: #071735;
		color: white;
		font-size: 14px;
		outline: none;
	}

	.player-name-section input:focus,
	.room-code-input:focus {
		border-color: #3edc8f;
	}

	.player-name-section small {
		color: #ffcc00;
		font-size: 10px;
	}

	.player-option.disabled {
		opacity: 0.4;
		filter: grayscale(0.8);
		cursor: not-allowed;
	}

	.player-option small {
		display: block;
		margin-top: 4px;
		color: #ffcc00;
		font-size: 9px;
	}

	.connection-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		font-size: 11px;
		margin: -4px 0 10px;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}

	.connection-status.online {
		color: #3edc8f;
	}

	.connection-status.online .status-dot {
		background: #3edc8f;
		box-shadow: 0 0 8px #3edc8f;
	}

	.connection-status.offline {
		color: #ff6b6b;
	}

	.connection-status.offline .status-dot {
		background: #ff6b6b;
	}

	.online-room-panel {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px;
		margin-top: 5px;
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid #2389a9;
		border-radius: 10px;
	}

	.online-title {
		text-align: center;
		color: #3edc8f;
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 1px;
	}

	.room-divider {
		text-align: center;
		color: #777;
		font-size: 10px;
	}

	.room-created {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 12px;
		background: #071735;
		border-radius: 8px;
	}

	.room-created span {
		color: #aaa;
		font-size: 9px;
		font-weight: bold;
	}

	.room-created strong {
		color: #ffcc00;
		font-size: 28px;
		letter-spacing: 5px;
	}

	.room-created small {
		color: #aaa;
		font-size: 10px;
	}
</style>
