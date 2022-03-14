
enchant.ui = { assets: ['pad.png', 'apad.png', 'icon0.png', 'font0.png'] };


enchant.ui.Pad = enchant.Class.create(enchant.Sprite, {

    initialize: function() {
        var core = enchant.Core.instance;
        var image = core.assets['pad.png'];
        enchant.Sprite.call(this, image.width / 2, image.height);
        this.image = image;
        this.input = { left: false, right: false, up: false, down: false };
        this.addEventListener('touchstart', function(e) {
            this._updateInput(this._detectInput(e.localX, e.localY));
        });
        this.addEventListener('touchmove', function(e) {
            this._updateInput(this._detectInput(e.localX, e.localY));
        });
        this.addEventListener('touchend', function(e) {
            this._updateInput({ left: false, right: false, up: false, down: false });
        });
    },
    _detectInput: function(x, y) {
        x -= this.width / 2;
        y -= this.height / 2;
        var input = { left: false, right: false, up: false, down: false };
        if (x * x + y * y > 200) {
            if (x < 0 && y < x * x * 0.1 && y > x * x * -0.1) {
                input.left = true;
            }
            if (x > 0 && y < x * x * 0.1 && y > x * x * -0.1) {
                input.right = true;
            }
            if (y < 0 && x < y * y * 0.1 && x > y * y * -0.1) {
                input.up = true;
            }
            if (y > 0 && x < y * y * 0.1 && x > y * y * -0.1) {
                input.down = true;
            }
        }
        return input;
    },
    _updateInput: function(input) {
        var core = enchant.Core.instance;
        ['left', 'right', 'up', 'down'].forEach(function(type) {
            if (this.input[type] && !input[type]) {
                core.changeButtonState(type, false);
            }
            if (!this.input[type] && input[type]) {
                core.changeButtonState(type, true);
            }
        }, this);
        this.input = input;
    }
});


enchant.ui.APad = enchant.Class.create(enchant.Group, {
    
    initialize: function(mode) {
        var core = enchant.Core.instance;
        var image = core.assets['apad.png'];
        var w = this.width = image.width;
        var h = this.height = image.height;
        enchant.Group.call(this);

        this.outside = new enchant.Sprite(w, h);
        var outsideImage = new enchant.Surface(w, h);
        outsideImage.draw(image, 0, 0, w, h / 4, 0, 0, w, h / 4);
        outsideImage.draw(image, 0, h / 4 * 3, w, h / 4, 0, h / 4 * 3, w, h / 4);
        outsideImage.draw(image, 0, h / 4, w / 4, h / 2, 0, h / 4, w / 4, h / 2);
        outsideImage.draw(image, w / 4 * 3, h / 4, w / 4, h / 2, w / 4 * 3, h / 4, w / 4, h / 2);
        this.outside.image = outsideImage;
        this.inside = new enchant.Sprite(w / 2, h / 2);
        var insideImage = new enchant.Surface(w / 2, h / 2);
        insideImage.draw(image, w / 4, h / 4, w / 2, h / 2, 0, 0, w / 2, h / 2);
        this.inside.image = insideImage;
        this.r = w / 2;

        
        this.rad = 0;
        this.dist = 0;

        if (mode === 'direct') {
            this.mode = 'direct';
        } else {
            this.mode = 'normal';
        }
        this._updateImage();
        this.addChild(this.inside);
        this.addChild(this.outside);
        this.addEventListener('touchstart', function(e) {
            this._detectInput(e.localX, e.localY);
            this._calcPolar(e.localX, e.localY);
            this._updateImage(e.localX, e.localY);
            this._dispatchPadEvent('apadstart');
            this.isTouched = true;
        });
        this.addEventListener('touchmove', function(e) {
            this._detectInput(e.localX, e.localY);
            this._calcPolar(e.localX, e.localY);
            this._updateImage(e.localX, e.localY);
            this._dispatchPadEvent('apadmove');
        });
        this.addEventListener('touchend', function(e) {
            this._detectInput(this.width / 2, this.height / 2);
            this._calcPolar(this.width / 2, this.height / 2);
            this._updateImage(this.width / 2, this.height / 2);
            this._dispatchPadEvent('apadend');
            this.isTouched = false;
        });
    },
    _dispatchPadEvent: function(type) {
        var e = new enchant.Event(type);
        e.vx = this.vx;
        e.vy = this.vy;
        e.rad = this.rad;
        e.dist = this.dist;
        this.dispatchEvent(e);
    },
    _updateImage: function(x, y) {
        x -= this.width / 2;
        y -= this.height / 2;
        this.inside.x = this.vx * (this.r - 10) + 25;
        this.inside.y = this.vy * (this.r - 10) + 25;
    },
    _detectInput: function(x, y) {
        x -= this.width / 2;
        y -= this.height / 2;
        var distance = Math.sqrt(x * x + y * y);
        var tan = y / x;
        var rad = Math.atan(tan);
        var dir = x / Math.abs(x);
        if (distance === 0) {
            this.vx = 0;
            this.vy = 0;
        } else if (x === 0) {
            this.vx = 0;
            if (this.mode === 'direct') {
                this.vy = (y / this.r);
            } else {
                dir = y / Math.abs(y);
                this.vy = Math.pow((y / this.r), 2) * dir;
            }
        } else if (distance < this.r) {
            if (this.mode === 'direct') {
                this.vx = (x / this.r);
                this.vy = (y / this.r);
            } else {
                this.vx = Math.pow((distance / this.r), 2) * Math.cos(rad) * dir;
                this.vy = Math.pow((distance / this.r), 2) * Math.sin(rad) * dir;
            }
        } else {
            this.vx = Math.cos(rad) * dir;
            this.vy = Math.sin(rad) * dir;
        }
    },
    _calcPolar: function(x, y) {
        x -= this.width / 2;
        y -= this.height / 2;
        var add = 0;
        var rad = 0;
        var dist = Math.sqrt(x * x + y * y);
        if (dist > this.r) {
            dist = this.r;
        }
        dist /= this.r;
        if (this.mode === 'normal') {
            dist *= dist;
        }
        if (x >= 0 && y < 0) {
            add = Math.PI / 2 * 3;
            rad = x / y;
        } else if (x < 0 && y <= 0) {
            add = Math.PI;
            rad = y / x;
        } else if (x <= 0 && y > 0) {
            add = Math.PI / 2;
            rad = x / y;
        } else if (x > 0 && y >= 0) {
            add = 0;
            rad = y / x;
        }
        if (x === 0 || y === 0) {
            rad = 0;
        }
        this.rad = Math.abs(Math.atan(rad)) + add;
        this.dist = dist;
    }
});


enchant.ui.Button = enchant.Class.create(enchant.Entity, {
    
    initialize: function(text, theme, height, width) {
        enchant.Entity.call(this);

        if (enchant.CanvasLayer) {
            this._element = 'div';
        }

        this.width = width || null;
        this.height = height || null;
        this.text = text;
        this.pressed = false;

        var style = this._style;
        style["display"] = "inline-block";
        style["font-size"] = "12px";
        style["height"] = "2em";
        style["line-height"] = "2em";
        style["min-width"] = "2em";
        style["padding"] = "2px 10px";
        style["text-align"] = "center";
        style["font-weight"] = "bold";
        style["border-radius"] = "0.5em";

        
        theme = theme || "dark";

        if (typeof theme === "string") {
            this.theme = enchant.ui.Button.DEFAULT_THEME[theme];
        } else {
            this.theme = theme;
        }

       
        this._applyTheme(this.theme.normal);


        this.addEventListener("touchstart", function() {
            this._applyTheme(this.theme.active);
            this.pressed = true;
            this.y++;
        });

        this.addEventListener("touchend", function() {
            this._applyTheme(this.theme.normal);
            this.pressed = false;
            this.y--;
        });
    },
    _applyTheme: function(theme) {
        var style = this._style;
        var css = enchant.ui.Button.theme2css(theme);
        for (var i in css) {
            if (css.hasOwnProperty(i)) {
                style[i] = css[i];
            }
        }
    },
    
    text: {
        get: function() {
            return this._text;
        },
        set: function(text) {
                this._text = text;
            if (!enchant.CanvasLayer) {
                this._element.innerHTML = text;
            }
        }
    },
    
    size: {
        get: function() {
            return this._style.fontSize;
        },
        set: function(size) {
            this._style.fontSize = size;
        }
    },

    font: {
        get: function() {
            return this._style.font;
        },
        set: function(font) {
            this._style.font = font;
        }
    },
    
    color: {
        get: function() {
            return this._style.color;
        },
        set: function(color) {
            this._style.color = color;
        }
    },
    cvsRender: function() {
        // not available now
    },
    domRender: function() {
        var element = this._domManager.element;
        element.innerHTML = this._text;
        element.style.font = this._font;
        element.style.color = this._color;
        element.style.textAlign = this._textAlign;
    }
});

enchant.ui.Button.theme2css = function(theme) {
    var prefix = '-' + enchant.ENV.VENDOR_PREFIX.toLowerCase() + '-';
    var obj = {};
    var bg = theme.background;
    var bd = theme.border;
    var ts = theme.textShadow;
    var bs = theme.boxShadow;
    if (prefix === '-ms-') {
        obj['background'] = bg.start;
    } else {
        obj['background-image'] = prefix + bg.type + '('+ [ 'top', bg.start, bg.end ] + ')';
    }
    obj['color'] = theme.color;
    obj['border'] = bd.color + ' ' + bd.width + ' ' + bd.type;
    obj['text-shadow'] = ts.offsetX + 'px ' + ts.offsetY + 'px ' + ts.blur + ' ' + ts.color;
    obj['box-shadow'] = bs.offsetX + 'px ' + bs.offsetY + 'px ' + bs.blur + ' ' + bs.color;
    return obj;
};

enchant.ui.Button.DEFAULT_THEME = {
    dark: {
        normal: {
            color: '#fff',
            background: { type: 'linear-gradient', start: '#666', end: '#333' },
            border: { color: '#333', width: 1, type: 'solid' },
            textShadow: { offsetX: 0, offsetY: 1, blur: 0, color: '#666' },
            boxShadow: { offsetX: 0, offsetY: 1, blur: 0, color: 'rgba(255, 255, 255, 0.3)' }
        },
        active: {
            color: '#ccc',
            background: { type: 'linear-gradient', start: '#333', end: '#000' },
            border: { color: '#333', width: 1, type: 'solid' },
            textShadow: { offsetX: 0, offsetY: 1, blur: 0, color: '#000' },
            boxShadow: { offsetX: 0, offsetY: 1, blur: 0, color: 'rgba(255, 255, 255, 0.3)' }
        }
    },
    light: {
        normal: {
            color: '#333',
            background: { type: 'linear-gradient', start: '#fff', end:'#ccc' },
            border: { color: '#999', width: 1, type: 'solid' },
            textShadow: { offsetX: 0, offsetY: 1, blur: 0, color: '#fff' },
            boxShadow: { offsetX: 0, offsetY: 1, blur: 0, color: 'rgba(0, 0, 0, 1)' },
        },
        active: {
            color: '#333',
            background: { type: 'linear-gradient', start: '#ccc', end: '#999' },
            border: { color: '#666', width: 1, type: 'solid' },
            textShadow: { offsetX: 0, offsetY: 1, blur: 0, color: '#ccc' },
            boxShadow: { offsetX: 0, offsetY: 1, blur: 0, color: 'rgba(255, 255, 255, 0.3)' }
        }
    },
    blue: {
        normal: {
            color: '#fff',
            background: { type: 'linear-gradient', start: '#04f', end: '#04c' },
            border: { color: '#026', width: 1, type: 'solid' },
            textShadow: { offsetX: 0, offsetY: 1, blur: 0, color: '#666' },
            boxShadow: { offsetX: 0, offsetY: 1, blur: 0, color: 'rgba(0, 0, 0, 0.5)' }
        },
        active: {
            color: '#ccc',
            background: { type: 'linear-gradient', start: '#029', end: '#026' },
            border: { color: '#026', width: 1, type: 'solid' },
            textShadow: { offsetX: 0, offsetY: 1, blur: 0, color: '#000' },
            boxShadow: 'none'
        }
    }
};


enchant.ui.MutableText = enchant.Class.create(enchant.Sprite, {
    
    initialize: function(x, y, width) {
        enchant.Sprite.call(this, 0, 0);
        this.fontSize = 16;
        this.widthItemNum = 16;
        this.x = x;
        this.y = y;
        this._imageAge = Number.MAX_VALUE;
        this.text = '';
        if (arguments[2]) {
            this.row = Math.floor(arguments[2] / this.fontSize);
        }
    },
    
    setText: function(txt) {
        var i, x, y, wNum, charCode, charPos;
        this._text = txt;
        var newWidth;
        if (!this.returnLength) {
            this.width = Math.min(this.fontSize * this._text.length, enchant.Game.instance.width);
        } else {
            this.width = Math.min(this.returnLength * this.fontSize, enchant.Game.instance.width);
        }
        this.height = this.fontSize * (Math.ceil(this._text.length / this.row) || 1);
        // if image is to small or was to big for a long time create new image
        if(!this.image || this.width > this.image.width || this.height > this.image.height || this._imageAge > 300) {
            this.image = new enchant.Surface(this.width, this.height);
            this._imageAge = 0;
        } else if(this.width < this.image.width || this.height < this.image.height) {
            this._imageAge++;
        } else {
            this._imageAge = 0;
        }
        this.image.context.clearRect(0, 0, this.width, this.height);
        for (i = 0; i < txt.length; i++) {
            charCode = txt.charCodeAt(i);
            if (charCode >= 32 && charCode <= 127) {
                charPos = charCode - 32;
            } else {
                charPos = 0;
            }
            x = charPos % this.widthItemNum;
            y = (charPos / this.widthItemNum) | 0;
            this.image.draw(enchant.Game.instance.assets['font0.png'],
                x * this.fontSize, y * this.fontSize, this.fontSize, this.fontSize,
                (i % this.row) * this.fontSize, ((i / this.row) | 0) * this.fontSize, this.fontSize, this.fontSize);
        }
    },
    
    text: {
        get: function() {
            return this._text;
        },
        set: function(txt) {
            this.setText(txt);
        }
    },
    
    row: {
        get: function() {
            return this.returnLength || this.width / this.fontSize;
        },
        set: function(row) {
            this.returnLength = row;
            this.text = this.text;
        }
    }
});


enchant.ui.ScoreLabel = enchant.Class.create(enchant.ui.MutableText, {
    
    initialize: function(x, y) {
        enchant.ui.MutableText.call(this, 0, 0);
        switch (arguments.length) {
            case 2:
                this.y = y;
                this.x = x;
                break;
            case 1:
                this.x = x;
                break;
            default:
                break;
        }
        this._score = 0;
        this._current = 0;
        this.easing = 2.5;
        this.text = this.label = 'SCORE:';
        this.addEventListener('enterframe', function() {
            if (this.easing === 0) {
                this.text = this.label + (this._current = this._score);
            } else {
                var dist = this._score - this._current;
                if (0 < dist) {
                    this._current += Math.ceil(dist / this.easing);
                } else if (dist < 0) {
                    this._current += Math.floor(dist / this.easing);
                }
                this.text = this.label + this._current;
            }
        });
    },
    
    score: {
        get: function() {
            return this._score;
        },
        set: function(newscore) {
            this._score = newscore;
        }
    }
});


enchant.ui.TimeLabel = enchant.Class.create(enchant.ui.MutableText, {
    
    initialize: function(x, y, counttype) {
        enchant.ui.MutableText.call(this, 0, 0);
        switch (arguments.length) {
            case 3:
            case 2:
                this.y = y;
                this.x = x;
                break;
            case 1:
                this.x = x;
                break;
            default:
                break;
        }
        this._time = 0;
        this._count = 1;
        if (counttype === 'countdown') {
            this._count = -1;
        }
        this.text = this.label = 'TIME:';
        this.addEventListener('enterframe', function() {
            this._time += this._count;
            this.text = this.label + (this._time / enchant.Game.instance.fps).toFixed(2);
        });
    },
    
    time: {
        get: function() {
            return Math.floor(this._time / enchant.Game.instance.fps);
        },
        set: function(newtime) {
            this._time = newtime * enchant.Game.instance.fps;
        }
    }
});


enchant.ui.LifeLabel = enchant.Class.create(enchant.Group, {
    
   
    initialize: function(x, y, maxlife) {
        enchant.Group.call(this);
        this.x = x || 0;
        this.y = y || 0;
        this._maxlife = maxlife || 9;
        this._life = 0;
        this.label = new enchant.ui.MutableText(0, 0, 80);
        this.label.text = 'LIFE:';
        this.addChild(this.label);
        this.heart = [];
        for (var i = 0; i < this._maxlife; i++) {
            this.heart[i] = new enchant.Sprite(16, 16);
            this.heart[i].image = enchant.Game.instance.assets['icon0.png'];
            this.heart[i].x = this.label.width + i * 16;
            this.heart[i].y = -3;
            this.heart[i].frame = 10;
            this.addChild(this.heart[i]);
        }
    },
    
    life: {
        get: function() {
            return this._life;
        },
        set: function(newlife) {
            this._life = newlife;
            if (this._maxlife < newlife) {
                this._life = this._maxlife;
            }
            for (var i = 0; i < this._maxlife; i++) {
                this.heart[i].visible = (i <= newlife - 1);
            }
        }
    }
});


enchant.ui.Bar = enchant.Class.create(enchant.Sprite, {
    
    initialize: function(x, y) {
        enchant.Sprite.call(this, 1, 16);
        this.image = new enchant.Surface(1, 16);
        this.image.context.fillColor = 'RGB(0, 0, 256)';
        this.image.context.fillRect(0, 0, 1, 16);
        this._direction = 'right';
        this._origin = 0;
        this._maxvalue = enchant.Game.instance.width;
        this._lastvalue = 0;
        this.value = 0;
        this.easing = 5;
        switch (arguments.length) {
            case 2:
                this.y = y;
                this.x = x;
                this._origin = x;
                break;
            case 1:
                this.x = x;
                this._origin = x;
                break;
            default:
                break;
        }
        this.addEventListener('enterframe', function() {
            if (this.value < 0) {
                this.value = 0;
            }
            this._lastvalue += (this.value - this._lastvalue) / this.easing;
            if (Math.abs(this._lastvalue - this.value) < 1.3) {
                this._lastvalue = this.value;
            }
            this.width = (this._lastvalue) | 0;
            if (this.width > this._maxvalue) {
                this.width = this._maxvalue;
            }
            if (this._direction === 'left') {
                this._x = this._origin - this.width;
            } else {
                this._x = this._origin;
            }
            this._updateCoordinate();
        });
    },
    
    direction: {
        get: function() {
            return this._direction;
        },
        set: function(newdirection) {
            if (newdirection !== 'right' && newdirection !== 'left') {
                // ignore
            } else {
                this._direction = newdirection;
            }
        }
    },
    
    x: {
        get: function() {
            return this._origin;
        },
        set: function(x) {
            this._x = x;
            this._origin = x;
            this._dirty = true;
        }
    },
    
    maxvalue: {
        get: function() {
            return this._maxvalue;
        },
        set: function(val) {
            this._maxvalue = val;
        }
    }
});


enchant.ui.VirtualMap = enchant.Class.create(enchant.Group, {
    
    initialize: function(meshWidth, meshHeight) {
        enchant.Group.call(this);
        this.meshWidth = meshWidth || 16;
        this.meshHeight = meshHeight || 16;
    },
    
    addChild: function(obj) {
        enchant.Group.prototype.addChild.call(this, obj);
        this.bind(obj);
    },
    
    insertBefore: function(obj, reference) {
        enchant.Group.prototype.insertBefore.call(this, obj, reference);
        this.bind(obj);
    },
    
    bind: function(obj) {
        Object.defineProperties(obj, {
            "mx": {
                get: function() {
                    return Math.floor(this.x / this.parentNode.meshWidth);
                },
                set: function(arg) {
                    this.x = Math.floor(arg * this.parentNode.meshWidth);
                }
            },
            "my": {
                get: function() {
                    return Math.floor(this.y / this.parentNode.meshHeight);
                },
                set: function(arg) {
                    this.y = Math.floor(arg * this.parentNode.meshWidth);
                }
            }
        });
        obj.mx = 0;
        obj.my = 0;
    }
});

function rand(num) {
    return Math.floor(Math.random() * num);
}
