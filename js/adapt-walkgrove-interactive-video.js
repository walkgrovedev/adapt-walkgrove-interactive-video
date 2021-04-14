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

            if(item._background === null) {
              this.$('.interactive-video__bg-image').addClass("is-hidden");
            } else {
              this.$('.interactive-video__bg-image').removeClass("is-hidden");
              this.$('.interactive-video__bg-image').attr("src", item._background);
            }

            this.$('.interactive-video__content-title').html(item.stepTitle);
            this.$('.interactive-video__content-body').html(item.stepBody);
            this.$('.interactive-video__content-instruction').html(item.stepInstruction);

          } else {
            $("." + item._id).addClass('u-visibility-hidden');
            $("." + item._id).addClass('hide');
          }
        });
        this.updateProgress();
      }
    },

    showPrevStage: function() {
      if(this._stageIndex > 0) {
        this._stageIndex--;
        this._stepIndex = this._stepIndex-2;
        this.model.get('_items').forEach((item, index) => {
          if(this._stepIndex === index) {
            $("." + item._id).removeClass('u-visibility-hidden');
            $("." + item._id).removeClass('hide');

            if(item._background === null) {
              this.$('.interactive-video__content-image').addClass("is-hidden");
            } else {
              this.$('.interactive-video__content-image').removeClass("is-hidden");
              this.$('.interactive-video__content-image').attr("src", item._background);
            }

          } else {
            $("." + item._id).addClass('u-visibility-hidden');
            $("." + item._id).addClass('hide');
          }
        });
        this.updateProgress();
      }
    },

    updateProgress: function() {

      this.model.get('_items').forEach((item, index) => {

       var stageI = Math.round(index/2);
       var activeIndex = (this._stageViewedIndex*2) - 2;
       var completeIndex = (this._stageViewedIndex*2) - 1;

       //console.log(activeIndex, completeIndex);
       //console.log(index, activeIndex, '-', index, this._stepIndex);

        if(index < completeIndex && index < this._stepIndex) {
         // console.log("complete: " + index + " - " + stageI);
          this.$('.interactive-video__progress-dot').eq(stageI).addClass('is-complete');
        } else if(index === activeIndex && index === this._stepIndex) {
          //console.log("active: " + index + " - " + stageI);
          this.$('.interactive-video__progress-dot').eq(stageI).addClass('is-active');
        } else {
          this.$('.interactive-video__progress-dot').eq(stageI).removeClass('is-complete');
          this.$('.interactive-video__progress-dot').eq(stageI).removeClass('is-active');
        }
      });

      if(this._stageViewedIndex < 1) {
        this.$('.js-prev-stage').prop('disabled', true);
      } else {
        this.$('.js-prev-stage').prop('disabled', false);
      }

      if(this._stepIndex < this._stepViewedIndex) {
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
