var sys = require('sys'),
    Director = require('./Director').Director,
    TextureAtlas = require('./TextureAtlas').TextureAtlas,
    Node = require('./Node').Node,
    geo = require('geometry'),
    ccp = geo.ccp;

/** @member cocos
 * @class
 */
var Sprite = Node.extend(/** @scope cocos.Sprite# */{
    textureAtlas: null,
    rect: null,
    dirty: true,
    recursiveDirty: true,
    quad: null,
    flipX: false,
    flipY: false,

    /** 
     * @param {String} opts.file Path to image to use as sprite atlas
     * @param {Rect} opts.rect The rect in the sprite atlas image file to use as the sprite
     */
    init: function(opts) {
        @super;

        var file         = opts['file'],
            textureAtlas = opts['textureAtlas'],
            texture      = opts['texture'],
            frame        = opts['frame'],
            spritesheet  = opts['spritesheet'],
            rect         = opts['rect'];

        if (frame) {
            texture = frame.get('texture');
            rect    = frame.get('rect');
        }

        if (file || texture) {
            textureAtlas = TextureAtlas.create({file: file, texture: texture});
        } else if (spritesheet) {
            textureAtlas = spritesheet.get('textureAtlas');
            this.set('useSpriteSheet', true);
        } else if (!textureAtlas) {
            throw "Sprite has no texture";
        }

        if (!rect && textureAtlas) {
            rect = {origin: ccp(0,0), size:{width: textureAtlas.texture.size.width, height: textureAtlas.texture.size.height}};
        }

        if (rect) {
            this.set('rect', rect);
            this.set('contentSize', rect.size);
        }

        this.quad = {
            drawRect: {origin: ccp(0, 0), size: rect.size},
            textureRect: rect
        };

        this.set('textureAtlas', textureAtlas);

        if (frame) {
            this.set('displayFrame', frame);
        }
    },

    _updateTextureQuad: function(obj, key, texture, oldTexture) {
        if (oldTexture) {
            oldTexture.removeQuad({quad: this.get('quad')})
        }

        if (texture) {
            texture.insertQuad({quad: this.get('quad')});
        }
    }.observes('textureAtlas'),

    _updateQuad: function() {
        if (!this.quad) {
            return;
        }

        this.quad.textureRect = sys.copy(this.rect);
        this.quad.drawRect.origin = ccp(0, 0);
        this.quad.drawRect.size = sys.copy(this.rect.size);
        if (this.flipX) {
            this.quad.drawRect.size.width *= -1;
            this.quad.drawRect.origin.x = -this.rect.size.width;
        }
        if (this.flipY) {
            this.quad.drawRect.size.height *= -1;
            this.quad.drawRect.origin.y = -this.rect.size.height;
        }
    }.observes('scale', 'scaleX', 'scaleY', 'rect', 'flipX', 'flipY'),

    updateTransform: function(ctx) {
        if (!this.useSpriteSheet) {
            throw "updateTransform is only valid when Sprite is being rendered using a SpriteSheet"
        }

        if (!this.visible) {
            this.set('dirty', false);
            this.set('recursiveDirty', false);
            return;
        }

        // TextureAtlas has hard reference to this quad so we can just update it directly
        this.quad.drawRect.origin = {
            x: this.position.x - this.anchorPointInPixels.x * this.scaleX,
            y: this.position.y - this.anchorPointInPixels.y * this.scaleY
        }
        this.quad.drawRect.size = {
            width: this.rect.size.width * this.scaleX,
            height: this.rect.size.height * this.scaleY
        }

        this.set('dirty', false);
        this.set('recursiveDirty', false);
    },

    draw: function(ctx) {
        this.get('textureAtlas').drawQuad(ctx, this.quad);
    },

    isFrameDisplayed: function(frame) {
        // TODO check texture name
        return (geo.rectEqualToRect(frame.rect, this.rect));
    },
    displayFrame: function(key, frame) {
        // TODO change texture

        this.set('rect', frame.get('rect'));
    }.property()
});

module.exports.Sprite = Sprite;
