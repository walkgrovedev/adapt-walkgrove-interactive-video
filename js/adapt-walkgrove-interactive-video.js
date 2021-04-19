const { find } = require("underscore");

define([
  'core/js/adapt',
  'core/js/views/componentView',
  'core/js/models/componentModel',
  'core/js/models/buildModel'
], function(Adapt, ComponentView, ComponentModel) {

  var InteractiveVideoView = ComponentView.extend({

    events: {
      'click .js-next-stage': 'showNextStep',
      'click .js-prev-stage': 'showPrevStage'
    },
    
    preRender: function() {
      this.checkIfResetOnRevisit();
    },

    postRender: function() {
      this.setReadyStatus();

      this.setUpSteps();
      this.showNextStep();
    },

    _stageIndex: 1,
    _stepIndex: -1,
    _stageViewedIndex: 1,
    _stepViewedIndex: -1,
    _moveOnAuto: false,
    
    checkIfResetOnRevisit: function() {
      var isResetOnRevisit = this.model.get('_isResetOnRevisit');

      // If reset is enabled set defaults
      if (isResetOnRevisit) {
        this.model.reset(isResetOnRevisit);
      }
    },

    setUpSteps: function() {

      var MediaView = Adapt.getViewClass('media');
      var DragdropView = Adapt.getViewClass('dragdrop');

      this.model.get('_items').forEach((item, index) => {

       var model = new Backbone.Model(item);
       var newComponent;

        switch(item._component) {
          case "media":
            newComponent = new MediaView({ model: model });
            
            this.model.listenTo(model,  'change', ()=> {
              if(model.get('_isMediaEnded') === true) {
                if(this._moveOnAuto === true) {
                  this.showNextStep();
                }else {
                  this.enableNext();
                }
              }
            });

            this.addStepModel(index, newComponent.$el);
            break;

          case "mcq":
            
            break;

          case "dragdrop":
            newComponent = new DragdropView({ model: model });

            this.model.listenTo(model,  'change', ()=> {
              if(model.get('_isComplete') === true) {
                console.log("dragdrop completed");
                this.showNextStage();
              }
            });

            this.addStepModel(index, newComponent.$el);
            break;
        }

      });
    },

    addStepModel: function (_index, _el) {
      var $container = $(".interactive-video__widget").eq(_index);
      $container.append(_el);  
    },

    showNextStage: function() {
      if(this._stageIndex < this.model.get('_stages').length) {
        this._stageIndex++;
        if(this._stageViewedIndex < this._stageIndex) {
          this._stageViewedIndex = this._stageIndex;
        }
        this.enableNext();
      }
      if(this._stageIndex === this.model.get('_stages').length) {
        this._stageViewedIndex++;
      }
    },

    showNextStep: function() {
      if(this._stepIndex < this.model.get('_items').length - 1) {
        this._stepIndex++;
        if(this._stepViewedIndex < this._stepIndex) {
          this._stepViewedIndex = this._stepIndex;
        }
        this.model.get('_items').forEach((item, index) => {
          if(this._stepIndex === index) {
            $("." + item._id).removeClass('u-visibility-hidden');
            $("." + item._id).removeClass('hide');

            this.setContent(item);

          } else {
            $("." + item._id).addClass('u-visibility-hidden');
            $("." + item._id).addClass('hide');
          }
        });
        this.updateProgress();
      }
    },

    showPrevStage: function() {
      if(this._stageIndex > 1) {
        this._stageIndex--;
        this._stepIndex = this._stepIndex-2;
        this.model.get('_items').forEach((item, index) => {
          if(this._stepIndex === index) {
            $("." + item._id).removeClass('u-visibility-hidden');
            $("." + item._id).removeClass('hide');

            this.setContent(item);

          } else {
            $("." + item._id).addClass('u-visibility-hidden');
            $("." + item._id).addClass('hide');
          }
        });
        this.updateProgress();
      }
    },

    setContent:function(_item) {
      if(_item._background === null) {
        this.$('.interactive-video__bg-image').addClass("is-hidden");
      } else {
        this.$('.interactive-video__bg-image').removeClass("is-hidden");

        this.$('.interactive-video__bg-img').attr("src", _item._background);
      }

      this.$('.interactive-video__widget').css({ height: '0px' });
      var heightDiv = this.$('.interactive-video__bg-image').height();
      this.$('.interactive-video__widget').eq(this._stepIndex).css({ height: Math.round(heightDiv) + 'px' });
      _.delay(() => {
        var heightDiv = this.$('.interactive-video__bg-image').height();
        this.$('.interactive-video__widget').eq(this._stepIndex).css({ height: Math.round(heightDiv) + 'px' });
      }, 1000);

      this.$('.interactive-video__content-title').html(_item.stepTitle);
      this.$('.interactive-video__content-body').html(_item.stepBody);
      this.$('.interactive-video__content-instruction').html(_item.stepInstruction);

    },

    updateProgress: function() {

      //dots
      this.model.get('_items').forEach((item, index) => {

       var stageI = Math.round(index/2);
       var activeIndex = (this._stageIndex*2) - 2;
       var completeIndex = (this._stageIndex*2) - 1;

       //console.log("this._stepIndex: " + this._stepIndex + " - activeIndex: " + activeIndex + " - completeIndex: " + completeIndex);

        if(index === this._stepIndex && this._stepIndex === activeIndex) { 
          //console.log("active: " + index + " - " + stageI);
          this.$('.interactive-video__progress-dot').eq(stageI).addClass('is-active');
        } else if(index <= this._stepIndex && this._stepIndex === completeIndex) { 
         //console.log("complete: " + index + " - " + stageI);
          this.$('.interactive-video__progress-dot').eq(stageI).addClass('is-complete');
        } else if(index > this._stepIndex) {
          this.$('.interactive-video__progress-dot').eq(stageI).removeClass('is-complete');
          this.$('.interactive-video__progress-dot').eq(stageI).removeClass('is-active');
        }
    
      });

      //buttons
      //console.log(this._stageIndex, this._stageViewedIndex, this._stepIndex, this._stepViewedIndex);

      if(this._stageIndex < 2) {
        this.$('.js-prev-stage').prop('disabled', true);
      } else {
        this.$('.js-prev-stage').prop('disabled', false);
      }

      if(this._stepIndex < this._stepViewedIndex && this._stepIndex < this.model.get('_items').length) {
        this.$('.js-next-stage').prop('disabled', false);
      }else {
        this.$('.js-next-stage').prop('disabled', true);
      }

    },

    enableNext: function() {
      this.$('.js-next-stage').prop('disabled', false);
    }



  },
  {
    template: 'interactive-video'
  });

  return Adapt.register('interactive-video', {
    model: ComponentModel.extend({}),// create a new class in the inheritance chain so it can be extended per component type if necessary later
    view: InteractiveVideoView
  });
});
