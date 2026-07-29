package net.minecraft.client.gui.components;

import java.util.function.Supplier;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.ActiveTextCollector;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.input.InputWithModifiers;
import net.minecraft.client.input.KeyEvent;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.util.ARGB;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.api.distmarker.OnlyIn;
import org.jspecify.annotations.Nullable;

@OnlyIn(Dist.CLIENT)
public abstract class AbstractButton extends AbstractWidget.WithInactiveMessage {
    protected static final int TEXT_MARGIN = 2;
    protected static final WidgetSprites SPRITES = new WidgetSprites(
        Identifier.withDefaultNamespace("widget/button"),
        Identifier.withDefaultNamespace("widget/button_disabled"),
        Identifier.withDefaultNamespace("widget/button_highlighted")
    );
    private @Nullable Supplier<Boolean> overrideRenderHighlightedSprite;

    public AbstractButton(int p_93365_, int p_93366_, int p_93367_, int p_93368_, Component p_93369_) {
        super(p_93365_, p_93366_, p_93367_, p_93368_, p_93369_);
    }

    public abstract void onPress(InputWithModifiers p_446730_);

    @Override
    protected final void renderWidget(GuiGraphics p_281670_, int p_282682_, int p_281714_, float p_282542_) {
        this.renderContents(p_281670_, p_282682_, p_281714_, p_282542_);
        this.handleCursor(p_281670_);
    }

    protected abstract void renderContents(GuiGraphics p_458060_, int p_457746_, int p_458121_, float p_457981_);

    protected void renderDefaultLabel(ActiveTextCollector p_457933_) {
        // Neo: Apply forced foreground color if set
        var message = this.getMessage();
        if (getFGColor() != UNSET_FG_COLOR) {
            message = message.copy().withStyle(style -> style.withColor(getFGColor()));
        }

        this.renderScrollingStringOverContents(p_457933_, message, 2);
    }

    protected final void renderDefaultSprite(GuiGraphics p_457624_) {
        p_457624_.blitSprite(
            RenderPipelines.GUI_TEXTURED,
            SPRITES.get(this.active, this.overrideRenderHighlightedSprite != null ? this.overrideRenderHighlightedSprite.get() : this.isHoveredOrFocused()),
            this.getX(),
            this.getY(),
            this.getWidth(),
            this.getHeight(),
            ARGB.white(this.alpha)
        );
    }

    @Override
    public void onClick(MouseButtonEvent p_446368_, boolean p_434377_) {
        this.onPress(p_446368_);
    }

    @Override
    public boolean keyPressed(KeyEvent p_445745_) {
        if (!this.isActive()) {
            return false;
        } else if (p_445745_.isSelection()) {
            this.playDownSound(Minecraft.getInstance().getSoundManager());
            this.onPress(p_445745_);
            return true;
        } else {
            return false;
        }
    }

    public void setOverrideRenderHighlightedSprite(Supplier<Boolean> p_470774_) {
        this.overrideRenderHighlightedSprite = p_470774_;
    }
}
