/*
 * Copyright 2016-2017 Open Text.
 *
 * Licensed under the MIT License (the "License"); you may not use this file
 * except in compliance with the License.
 *
 * The only warranties for products and services of Open Text and its affiliates
 * and licensors ("Open Text") are as may be set forth in the express warranty
 * statements accompanying such products and services. Nothing herein should be
 * construed as constituting an additional warranty. Open Text shall not be
 * liable for technical or editorial errors or omissions contained herein. The
 * information contained herein is subject to change without notice.
 */

const _ = require('underscore');
const $ = require('jquery');
const Backbone = require('backbone');
const HtmlUtil = require('find/idol/app/util/html');
const AnsweredQuestionsCollection = require('find/idol/app/model/answer-bank/idol-answered-questions-collection');
const ListView = require('js-whatever/js/list-view');
const questionsTemplate = require('find/templates/app/page/search/results/questions-container.html');
const i18n = require('find/nls/bundle');

const MAX_SIZE = 1;

function isLink(value) {
    return value && /^\s*https?:\/\/.+/.exec(value);
}

module.exports = Backbone.View.extend({
        events: {
            'click .read-more': function(e) {
                const $target = $(e.currentTarget);
                const $summary = $target.siblings('.summary-text');
                $summary.toggleClass('answer-summary');

                const isResultSummary = $summary.hasClass('answer-summary');
                $target.text(isResultSummary ? i18n['app.more'] : i18n['app.less']);
            }
        },

        initialize: function(options) {
            this.answeredQuestionsCollection = new AnsweredQuestionsCollection();
            this.queryModel = options.queryModel;
            this.loadingTracker = options.loadingTracker;
            this.clearLoadingSpinner = options.clearLoadingSpinner;

            this.template = _.template(questionsTemplate);
        },

        render: function() {
            this.$('[data-toggle="tooltip"]').tooltip('destroy');

            const html = this.answeredQuestionsCollection.map(function(answeredQuestion) {
                const answer = answeredQuestion.get('answer');
                return this.template({
                    i18n: i18n,
                    model: answeredQuestion,
                    answer: HtmlUtil.sanitiseHTML(answer),
                    isLink: isLink
                });
            }, this).join('');

            this.$el.html(html);
            this.$('[data-toggle="tooltip"]').tooltip({
                container: 'body',
                placement: 'top'
            });

            const $answer = this.$('.summary-text');
            if ($answer[0] && $answer[0].scrollHeight <= $answer[0].clientHeight) {
                this.$('.read-more').addClass('hide');
            }

            return this;
        },

        fetchData: function() {
            this.$el.empty();
            const questionText = this.queryModel.get('questionText');

            if (questionText) {
                this.loadingTracker.questionsFinished = false;
                this.answeredQuestionsCollection.fetch({
                    data: {
                        text: questionText,
                        fieldText: this.queryModel.get('fieldText'),
                        maxResults: MAX_SIZE,
                        indexes: this.queryModel.get('indexes')
                    },
                    reset: true,
                    success: _.bind(function() {
                        this.render();
                        this.loadingTracker.questionsFinished = true;
                        this.clearLoadingSpinner();
                    }, this),
                    error: _.bind(function() {
                        this.loadingTracker.questionsFinished = true;
                        this.clearLoadingSpinner();
                    }, this)
                }, this);

            } else {
                this.answeredQuestionsCollection.reset();
            }
        },

        remove: function() {
            this.$('[data-toggle="tooltip"]').tooltip('destroy');
            Backbone.View.prototype.remove.call(this);
        }
    });

