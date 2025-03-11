function animaster() {
    /**
     * Блок плавно появляется из прозрачного.
     * @param element — HTMLElement, который надо анимировать
     * @param duration — Продолжительность анимации в миллисекундах
     */
    function fadeIn(element, duration) {
        element.style.transitionDuration = `${duration}ms`;
        element.classList.remove('hide');
        element.classList.add('show');
    }

    /**
     * Блок плавно появляется из прозрачного.
     * @param element — HTMLElement, который надо анимировать
     * @param duration — Продолжительность анимации в миллисекундах
     */
    function fadeOut(element, duration) {
        element.style.transitionDuration = `${duration}ms`;
        element.classList.remove('show');
        element.classList.add('hide');
    }

    /**
     * Функция, передвигающая элемент
     * @param element — HTMLElement, который надо анимировать
     * @param duration — Продолжительность анимации в миллисекундах
     * @param translation — объект с полями x и y, обозначающими смещение блока
     */
    function move(element, duration, translation) {
        element.style.transitionDuration = `${duration}ms`;
        element.style.transform = getTransform(translation, null);
    }

    /**
     * Функция, увеличивающая/уменьшающая элемент
     * @param element — HTMLElement, который надо анимировать
     * @param duration — Продолжительность анимации в миллисекундах
     * @param ratio — во сколько раз увеличить/уменьшить. Чтобы уменьшить, нужно передать значение меньше 1
     */
    function scale(element, duration, ratio) {
        element.style.transitionDuration = `${duration}ms`;
        element.style.transform = getTransform(null, ratio);
    }

    /**
     * @param element — HTMLElement, который надо анимировать
     * @param duration — Продолжительность анимации в миллисекундах
     */
    function moveAndHide(element, duration) {
        move(element, duration * 0.4, { x: 100, y: 20 });
        const fadeOutTimeoutId = setTimeout(() => {
            fadeOut(element, duration * 0.6);
        }, duration * 0.4);
        return {
            stop: () => clearTimeout(fadeOutTimeoutId),
            reset: () => {
                clearTimeout(fadeOutTimeoutId);
                resetMoveAndScale(element);
                // Для возврата к исходному состоянию вызывается resetFadeIn
                resetFadeIn(element);
            }
        };
    }

    /**
     * @param element — HTMLElement, который надо анимировать
     * @param duration — Продолжительность анимации в миллисекундах
     */
    function showAndHide(element, duration) {
        fadeIn(element, duration * 0.33);
        setTimeout(() => {
            fadeOut(element, duration * 0.33);
        }, duration * 0.67);
    }

    /**
     * @param element — HTMLElement, который надо анимировать
     * @param duration — Продолжительность анимации в миллисекундах
     */
    function heartBeating(element, duration = 500) {
        let stopped = false;
        let timeoutIds = [];
        const intervalId = setInterval(() => {
            if (stopped) return;
            scale(element, duration, 1.4);
            const tId = setTimeout(() => {
                if (!stopped) {
                    scale(element, duration, 1);
                }
            }, duration);
            timeoutIds.push(tId);
        }, duration * 2);
        return {
            stop: () => {
                stopped = true;
                clearInterval(intervalId);
                timeoutIds.forEach(clearTimeout);
            }
        };
    }

    function resetFadeIn(element) {
        element.style.transitionDuration = null;
        element.classList.remove('show');
        element.classList.add('hide');
    }
    
    function resetFadeOut(element) {
        element.style.transitionDuration = null;
        element.classList.remove('hide');
    }
    
    function resetMoveAndScale(element) {
        element.style.transitionDuration = null;
        element.style.transform = null;
    }
    
    return {
        fadeIn,
        fadeOut,
        move,
        scale,
        moveAndHide(element, duration) {
            this._steps = [];
            this.addMove(duration * 0.4, { x: 100, y: 20 })
                .addFadeOut(duration * 0.6);
            return this.play(element);
        },
        showAndHide(element, duration) {
            this._steps = [];
            this.addFadeIn(duration / 3)
                .addDelay(duration / 3)
                .addFadeOut(duration / 3);
            return this.play(element);
        },
        heartBeating(element, duration = 500) {
            this._steps = [];
            this.addScale(duration, 1.4)
                .addScale(duration, 1);
            return this.play(element, true);
        },
        shadowPulse(element, duration) {
            const originalBoxShadow = element.style.boxShadow;
            element.style.transition = `box-shadow ${duration / 2}ms ease-in-out`;
            element.style.boxShadow = "0 0 20px 5px rgba(0,0,0,0.7)";
            const timeoutId = setTimeout(() => {
                element.style.boxShadow = originalBoxShadow || "none";
            }, duration / 2);
            return {
                stop: () => {
                    clearTimeout(timeoutId);
                    element.style.boxShadow = originalBoxShadow || "none";
                },
                reset: () => {
                    element.style.transition = "";
                    element.style.boxShadow = originalBoxShadow || "";
                }
            };
        },
        _resetFadeIn: resetFadeIn,
        _resetFadeOut: resetFadeOut,
        _resetMoveAndScale: resetMoveAndScale,
        _steps: [],
        addMove(duration, translation) {
            this._steps.push({ type: 'move', duration, translation });
            return this;
        },
        addScale(duration, ratio) {
            this._steps.push({ type: 'scale', duration, ratio });
            return this;
        },
        addFadeIn(duration) {
            this._steps.push({ type: 'fadeIn', duration });
            return this;
        },
        addFadeOut(duration) {
            this._steps.push({ type: 'fadeOut', duration });
            return this;
        },
        addDelay(duration) {
            this._steps.push({ type: 'delay', duration });
            return this;
        },
        play(element, cycled = false) {
            const wasHidden = element.classList.contains('hide');
            let cumulativeDelay = 0;
            const timeouts = [];
            for (const step of this._steps) {
                let action;
                if (step.type === 'move') {
                    action = () => { this.move(element, step.duration, step.translation); };
                } else if (step.type === 'scale') {
                    action = () => { this.scale(element, step.duration, step.ratio); };
                } else if (step.type === 'fadeIn') {
                    action = () => { this.fadeIn(element, step.duration); };
                } else if (step.type === 'fadeOut') {
                    action = () => { this.fadeOut(element, step.duration); };
                } else if (step.type === 'delay') {
                    action = () => { };
                }
                const timeout = setTimeout(action, cumulativeDelay);
                timeouts.push(timeout);
                cumulativeDelay += step.duration;
            }
            if (cycled) {
                const cycleTimeout = setTimeout(() => {
                    this.play(element, true);
                }, cumulativeDelay);
                timeouts.push(cycleTimeout);
            }
            return {
                stop: () => {
                    timeouts.forEach(clearTimeout);
                },
                reset: () => {
                    // Сброс трансформации
                    this._resetMoveAndScale(element);
                    // Если элемент изначально был скрыт, возвращаем его скрытым,
                    // иначе показываем его.
                    if (wasHidden) {
                        this._resetFadeIn(element);
                    } else {
                        this._resetFadeOut(element);
                    }
                }
            };
        }
    };
}

addListeners();

function addListeners() {
    document.getElementById('fadeInPlay')
        .addEventListener('click', function () {
            const block = document.getElementById('fadeInBlock');
            animaster().fadeIn(block, 1000);
        });

    document.getElementById('fadeInReset')
        .addEventListener('click', function () {
            const block = document.getElementById('fadeInBlock');
            animaster()._resetFadeIn(block);
        });

    document.getElementById('fadeOutPlay')
        .addEventListener('click', function () {
            const block = document.getElementById('fadeOutBlock');
            animaster().fadeOut(block, 1000);
        });

    document.getElementById('fadeOutReset')
        .addEventListener('click', function () {
            const block = document.getElementById('fadeOutBlock');
            animaster()._resetFadeOut(block);
        });

    document.getElementById('movePlay')
        .addEventListener('click', function () {
            const block = document.getElementById('moveBlock');
            animaster().move(block, 1000, { x: 100, y: 10 });
        });

    document.getElementById('moveReset')
        .addEventListener('click', function () {
            const block = document.getElementById('moveBlock');
            animaster()._resetMoveAndScale(block);
        });

    document.getElementById('scalePlay')
        .addEventListener('click', function () {
            const block = document.getElementById('scaleBlock');
            animaster().scale(block, 1000, 1.25);
        });

    document.getElementById('scaleReset')
        .addEventListener('click', function () {
            const block = document.getElementById('scaleBlock');
            animaster()._resetMoveAndScale(block);
        });

    document.getElementById('moveAndHidePlay')
        .addEventListener('click', function () {
            const block = document.getElementById('moveAndHideBlock');
            block._moveAndHideAnimation = animaster().moveAndHide(block, 1000);
        });

    document.getElementById('moveAndHideReset')
        .addEventListener('click', function () {
            const block = document.getElementById('moveAndHideBlock');
            if (block._moveAndHideAnimation) {
                block._moveAndHideAnimation.reset();
                block._moveAndHideAnimation = null;
            }
        });

    document.getElementById('showAndHidePlay')
        .addEventListener('click', function () {
            const block = document.getElementById('showAndHideBlock');
            animaster().showAndHide(block, 1000);
        });

    document.getElementById('showAndHideReset')
        .addEventListener('click', function () {
            const block = document.getElementById('showAndHideBlock');
            animaster()._resetFadeIn(block);
            animaster()._resetFadeOut(block);
        });

    document.getElementById('heartBeatingPlay')
        .addEventListener('click', function () {
            const block = document.getElementById('heartBeatingBlock');
            block._heartBeatingAnimation = animaster().heartBeating(block);
        });

    document.getElementById('heartBeatingStop')
        .addEventListener('click', function () {
            const block = document.getElementById('heartBeatingBlock');
            if (block._heartBeatingAnimation) {
                    block._heartBeatingAnimation.stop();
                    block._heartBeatingAnimation = null;
                }
            });
        document.getElementById('shadowPulsePlay')
            .addEventListener('click', function () {
                const block = document.getElementById('shadowPulseBlock');
                block._shadowPulseAnimation = animaster().shadowPulse(block, 1000);
            });
        document.getElementById('shadowPulseReset')
            .addEventListener('click', function () {
                const block = document.getElementById('shadowPulseBlock');
                if (block._shadowPulseAnimation) {
                    block._shadowPulseAnimation.reset();
                    block._shadowPulseAnimation = null;
                }
            });
}

function getTransform(translation, ratio) {
    const result = [];
    if (translation) {
        result.push(`translate(${translation.x}px,${translation.y}px)`);
    }
    if (ratio) {
        result.push(`scale(${ratio})`);
    }
    return result.join(' ');
}

// Пример использования:
// const customAnimation = animaster()
//     .addMove(200, { x: 40, y: 40 })
//     .addScale(800, 1.3)
//     .addMove(200, { x: 80, y: 0 })
//     .addScale(800, 1)
//     .addMove(200, { x: 40, y: -40 })
//     .addScale(800, 0.7)
//     .addMove(200, { x: 0, y: 0 })
//     .addScale(800, 1);
// customAnimation.play(document.getElementById('moveBlock'));
