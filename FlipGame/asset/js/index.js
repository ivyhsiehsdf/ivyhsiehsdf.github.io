import { DifyComfyUIService } from '../../service/difyComfyUIService.js';
import { retryWithDelay } from '../js/utilities/retryWithDelay.js';
const { createApp } = Vue;

const vue = createApp({
  data() {
    return {
      initialCards: [],
      cardList: [],
      firstCardIndex: null,
      isStart: false,
      isChecking: false,
      isGameOver: false,
      timeLeft: 60, // 倒計時秒數
      totalTime: 60, // 總時間，方便計算進度條
      timer: null, // 計時器
      currentLevel: 1,
      cardCountStyle: [ // 關卡設定
        {
          initialCard: 2,
          cardCount: 4, //總卡數
          gameTime: 10, // 總時間
          class: "grid-cols-2  grid-rows-2", // 卡片顯示樣式
          canSeeCardTime: 1500 //可看卡片的時間
        },
        {
          initialCard: 4,
          cardCount: 8,
          gameTime: 20,
          class: "grid-cols-4  grid-rows-2",
          canSeeCardTime: 2000
        },
        {
          initialCard: 6,
          cardCount: 12,
          gameTime: 30,
          class: "grid-cols-4  grid-rows-3",
          canSeeCardTime: 2500
        },
        /*  {
           initialCard: 8,
           cardCount: 16,
           gameTime: 60,
           class: "grid-cols-4 grid-rows-4",
           canSeeCardTime: 3000
         },
         {
           initialCard: 10,
           cardCount: 20,
           gameTime: 90,
           class: "grid-cols-4 grid-rows-5",
           canSeeCardTime: 3500
         }, */
      ],
      artStyles: [
        "卡通風格",
        "像素藝術",
        "水彩畫",
        "塗鴉風格",
        "超現實主義",
        "極簡主義",
        "復古插畫",
        "幾何抽象",
        "蒸汽朋克",
        "波普藝術",
        "日本浮世繪",
        "立體派",
        "表現主義",
        "新藝術風格",
        "黑白素描",
        "剪紙藝術",
        "拼貼藝術",
        "科幻插畫",
        "童話插畫",
        "印象派"
      ],
      cardPrompt: "，有一隻寶可夢，線條清晰，突顯角色的主體，背景是透明純白色，size:630x630, seed:",
      speed: getRandomInt(1000, 2000),
      gameOverMsg: "",
      isStartFlip: false
    };
  },
  created() {
    this.getInitialCards(this.currentLevel)
  },
  beforeUnmount() { },
  computed: {
    // 計算進度條的寬度百分比
    progressBarWidth() {
      return (this.timeLeft / this.totalTime) * 100 + "%";
    },
    // 判斷是否進入警告狀態
    isWarning() {
      return this.timeLeft <= 10; // 少於 10 秒時顯示警告
    },
    cardGridClass() {
      if (this.cardList.length > 0) {
        return this.currentLevelInfo.class;
      }
      return "";
    },
    maxLevel() {
      return this.cardCountStyle.length;
    },
    isFirstStart() {
      return this.currentLevel === 1;
    },
    isNextLevel() {
      return this.currentLevel !== 1 && !this.isMaxLevel;
    },
    isMaxLevel() {
      return this.currentLevel > this.maxLevel;
    },
    isFinishGame() {
      return this.isMaxLevel && this.isGameOver
    },
    isLoading() {
      return this.isStart && this.cardList.length == this.currentLevelInfo.cardCount
    },
    beforeStartMsg() {
      if (this.currentLevel === 1) {
        return `請按下"開始"`
      } else if (this.isFinishGame) {
        return "恭喜！您完成所有關卡！"
      } else {
        return `恭喜！您完成本次關卡！<br/>
        請前往第${this.currentLevel}關卡`
      }
    },
    currentLevelInfo() {
      return this.cardCountStyle[this.currentLevel - 1]
    }

  },
  watch: {
    isLoading(bool) {
      if (bool && this.isStart) {
        //過1.5秒後將卡片蓋上並啟動計時器
        setTimeout(() => {
          this.cardList.forEach((element) => {
            element.flipped = false;
          });
          this.startTimer(); // 啟動計時器
        }, this.currentLevelInfo.canSeeCardTime);
      }
    },
    initialCards: {
      handler(list) {
        const cardListLength = this.cardList.length;

        if (list.length >= this.currentLevelInfo.initialCard && cardListLength < this.currentLevelInfo.cardCount) {
          this.initGameCardList()
        }
      },
      deep: true // 深度監看陣列中的每一個元素

    },
    isStart(bool) {
      if (bool && !this.gameOver && this.initialCards.length >= this.currentLevelInfo.initialCard) {
        this.initGameCardList()
      }
    },
    isStartFlip(bool) {
      if (bool) {
        if (this.currentLevel >= this.maxLevel ) return
        this.getInitialCards(this.currentLevel + 1)
      }

    }

  },
  methods: {
    starGame() {
      this.isStart = true;
      this.setGameLevel(this.currentLevel);
    },
    setGameLevel(level) {
      const levelInfo = this.cardCountStyle[level - 1];
      this.firstCardIndex = null;
      this.isGameOver = false;
      this.isStartFlip = false;
      // 初始化倒計時
      this.totalTime = levelInfo.gameTime;
      this.timeLeft = this.totalTime;

    },
    initGameCardList() {
      const cardCount = this.currentLevelInfo.initialCard;
      const list = this.initialCards.slice(0, cardCount)
      const cardPairs = [...list, ...list]; // 複製一份以配對
      const copyList = this.shuffle(cardPairs).map((card) => ({
        ...card,
        flipped: true, //先將卡片都顯示
        matched: false,
      }));
      this.cardList = copyList;
    },
    getInitialCards(level) {
      const levelInfo = this.cardCountStyle[level - 1]
      this.getCardInfo(levelInfo.initialCard)
    },
    async getCardInfo(needCardCount) {
      while (this.initialCards.length < needCardCount) {
        this.speed += 150
        try {
          const data = await this.getAIImageData()
          this.initialCards.push(data)
        }
        catch (e) {
          await retryWithDelay(
            async () => {
              this.speed += 150

              const data = await this.getAIImageData()
              if (data) {
                this.initialCards.push(data)
              } else {
                throw new Error('Result not ready');
              }

            },
            {
              maxRetries: 5,
              delay: 10000,
            }
          )

        }
      }

    },
    getComfyFluxImageApi(conversationId) {
      const request = {
        "inputs": {},
        "query": this.artStyles[0] + this.cardPrompt + this.speed,
        "response_mode": "streaming",
        "user": "apiUser",
      }
      if (conversationId) {
        request.query = "result"
        request.conversation_id = conversationId
      }
      return new Promise((resolve, reject) => {
        DifyComfyUIService.getComfyFluxImage(request)
          .then(async response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let parsedData = null

            while (!done) {
              const { value, done: readerDone } = await reader.read();
              done = readerDone;
              if (value) {
                const lines = decoder.decode(value, { stream: true }).split("\n")
                for (let index = 0; index < lines.length; index++) {
                  let line = lines[index]
                  let chunkObj = null
                  if (!line.startsWith("data:")) continue;
                  line = line.slice(5).trim()
                  if (line.startsWith("{")) {
                    chunkObj = JSON.parse(line);
                  } else {
                    continue;
                  }
                  if (chunkObj.event === "agent_thought") {
                    parsedData = chunkObj
                  }
                }
              }
            }
            resolve(parsedData)
          })

      })
    },
    getAIImageData() {
      return new Promise((resolve, reject) => {
        this.getComfyFluxImageApi()
          .then(async data => {
            if (data.thought.includes(".png")) {
              let str = data.thought.split("](")[1];
              str = str.split(")")[0]
              resolve({
                value: data.message_id,
                url: str
              });
            } else {
              try {
                const result = await retryWithDelay(
                  async () => {
                    const response = await this.getComfyFluxImageApi(data.conversation_id)

                    if (response.thought.includes(".png")) {
                      let str = response.thought.split("](")[1];
                      str = str.split(")")[0]
                      return {
                        value: response.message_id,
                        url: str
                      };
                    } else {
                      throw new Error('Result not ready');
                    }

                  },
                  {
                    maxRetries: 5,
                    delay: 10000,
                  }
                );
                resolve(result)
              } catch (e) {
                reject(null)
              }

            }
          })
      });
    },
    shuffle(array) {
      //Fisher-Yates 洗牌算法
      for (let i = array.length - 1; i > 0; i--) {
        // 產生 0 到 i 之間的隨機數
        const j = Math.floor(Math.random() * (i + 1));
        // 交換 array[i] 和 array[j]
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },
    flipCard(index) {
      if (this.isChecking || this.cardList[index].flipped) {
        return; // 避免在檢查過程中或已翻過的卡片重複點擊
      }
      if (!this.isStartFlip) {
        this.isStartFlip = true
      }

      this.cardList[index].flipped = true;

      if (this.firstCardIndex === null) {
        this.firstCardIndex = index; // 記錄第一張翻開的卡片
      } else {
        this.isChecking = true;
        const firstCard = this.cardList[this.firstCardIndex];
        const secondCard = this.cardList[index];

        if (firstCard.value === secondCard.value) {
          // 如果兩張卡片匹配
          this.cardList[this.firstCardIndex].matched = true;
          this.cardList[index].matched = true;
          this.checkGameOver();
          this.resetSelection();
        } else {
          // 如果不匹配，過一段時間後翻回去
          setTimeout(() => {
            this.cardList[this.firstCardIndex].flipped = false;
            this.cardList[index].flipped = false;
            this.resetSelection();
          }, 500);
        }
      }
    },
    resetSelection() {
      this.firstCardIndex = null;
      this.isChecking = false;
    },
    checkGameOver() {
      // 檢查是否所有卡片都被匹配
      const allMatched = this.cardList.every((card) => card.matched);
      if (allMatched) {
        clearInterval(this.timer); // 停止計時器

        setTimeout(() => {
          this.isGameOver = true; // 設定遊戲結束狀態
          this.isStart = false;
          this.currentLevel += 1;

          // 你可以在這裡實現跳轉或下一題的邏輯
        }, 1000);
      }
    },
    startTimer() {
      if (this.timer) {
        clearInterval(this.timer); // 重設計時器
      }
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          clearInterval(this.timer); // 停止計時器
          this.cardList.forEach((element) => {
            element.flipped = false;
          });
          this.isGameOver = true; // 設定遊戲結束狀態
          this.gameOverMsg = "時間到了！你失敗了。"; // 顯示失敗訊息
        }
      }, 1000);
    },
  },
});
vue.mount("#app");

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
