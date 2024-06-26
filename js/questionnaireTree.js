/**
 *  questionnaireTree: a flowchart questionnaire and survey tool for creating questions from structured JSON data objects in a specified pattern.
 */
var questionnaireTree = function (qt) {
    /**
     * local reference to top level questions object
     * @type {object}
     */
    var oQuestions = qt.questions
        /**
         * keep track of current question
         * @type {number}
         */
        , currentQueston = 1
        /**
         * answers object
         * @type {object}
         */
        , oAnswers = qt.answers
        /**
         * selector for container element
         * @type {string}
         */
        , sContainer = qt.containerID
        /**
         * should push state be used to track pages/page states in order to provide navigatability
         * @type {boolean}
         */
        , bUsePushState = qt.usePushState
        /**
         * placeholder for the container element
         * @type {DOMElement}
         */
        , elContainer
        /**
         * Object to keep track of all references 
         * @type {Object}
         */
        , oReferences = {
            QTag: 'div'
            , QTagPrefix: 'qt-question-'
            , QTagBaseClass: 'qt-question'
            , QTagActiveClass: 'qt-active'
            , QTagInactiveClass: 'qt-inactive'
            , OptTag: 'a'
            , OptPrefix: 'option-'
            , OptClass: 'qt-option'
            , OptLblData: 'data-answer'
            , OptValData: 'data-val'
            , ATag: 'div'
            , ATagId: 'answer-result'
        }
        /**
         * start questionnaireTree processing
         * @param  {object}     data    the questionnaireTree data object
         * @return {void}               nothing 
         */
        , _start = function (data) {
            console.log('starting...');
            _buildQuestion(currentQueston);

            if (bUsePushState) {
                window.addEventListener('popstate', function (e) {
                    var
                        oQuestion = e.state
                        ;
                    // e.state is equal to the data-attribute of the last image we clicked
                    console.log(oQuestion);
                    _buildQuestion(oQuestion.qid);
                });
            }
        }
        /**
         * Add new page to browser's history to make navigation possible
         * @description Keep in mind that running this locally is likely to cause issues. A history state object cannot be created in a document with origin 'null'.
         * @param       {number} quid   the question id number
         * @param       {object} data   the question object
         * @property    {string} title  the title of the new page adding to history
         * @property    {string} url    the url of the new page adding to history
         * @return {void}
         */
        , _newPageQuestion = function (qid, data) {
            var
                title = data.question
                , url = title.replace(' ', '-')
                , oQuestion = {
                    qid: qid,
                    data: data
                }
                ;

            history.pushState(oQuestion, title, url);
        }
        /**
         * build a question
         * @param  {number}     qid     the question number to build
         * @return {void}               nothing 
         */
        , _buildQuestion = function (qid) {
            // questions
            var thisQ = oQuestions[qid]
                , questionTag = oReferences.QTag
                , questionTagID = oReferences.QTagPrefix + qid
                , questionClasses = oReferences.QTagBaseClass + ' ' + oReferences.QTagActiveClass
                , questionTxt = thisQ.question + '<br>'

                // answer options
                , newOptTag = oReferences.OptTag
                , newOptElPrefix = oReferences.OptPrefix
                , newOptElClasses = oReferences.OptClass
                , newOptData = oReferences.OptLblData
                , newValData = oReferences.OptValData
                , i = 0
                , oOptions = thisQ['options']
                , sCustomOptionClasses
                ;

            var questionEl = _appendChild({
                elParent: elContainer,
                newTag: questionTag,
                newElID: questionTagID,
                elClasses: questionClasses
            });

            // Append the EERE tricolor bar to the question display box
            _appendChild({
                elParent: questionEl, // Assuming the tricolor bar should be inside questionEl but adjust as needed
                newTag: 'div',
                newElID: 'tricolor-bar',
                elClasses: 'tricolor-bar'
            });

            // Append the default WGT text above the question
            _appendChild({
                elParent: questionEl, // Use the questionEl as the parent element
                newTag: 'div',
                newElID: 'header-text',
                elClasses: 'header-text-class', // Add a class for styling
                sHTML: '<div style="text-align:center;">Does Your New Web Project Need WGT Review?</div>'
            });

            // Create and append the 'question-displaybox' div that holds customized question text
            _appendChild({
                elParent: questionEl,
                newTag: 'div',
                newElID: 'question-displaybox',
                elClasses: 'qt-displaybox',
                sHTML: questionTxt
            });

            // Add options under 'options-displaybox' div that holds selectable options and navigation
            var optionsDisplayBox = _appendChild({
                elParent: questionEl,
                newTag: 'div',
                newElID: 'options-displaybox',
                elClasses: 'qt-options-displaybox .poppins-bold',
            });

            createResetButton(optionsDisplayBox);

            for (var optName in oOptions) {
                // if there are custom classes used in options...
                sOptionClasses = oOptions[optName].classes || '';

                // add options
                _appendChild({
                    elParent: optionsDisplayBox,
                    newTag: newOptTag,
                    newElID: questionTagID + '-' + newOptElPrefix + optName,
                    elClasses: newOptElClasses + ' ' + sOptionClasses,
                    attribs: [
                        { aName: newOptData, aVal: oOptions[optName].val },
                        { aName: newValData, aVal: optName }
                    ],
                    sHTML: oOptions[optName].label
                }).addEventListener('click', _recordAnswer, false);
            }

            // if push state setting is turned on, add question as a page to browser's history
            if (bUsePushState) {
                _newPageQuestion(qid, thisQ);
            }
        }
        , _init = function () {
            elContainer = _getEl(sContainer);
            _start();
        }()
        ;

    /**
     * Answer selection callback
     * @this        {DOMElement}    The DOM element of the answer
     * @property    {string}        answerVal   the string of the answer
     * @property    {string}        dataVal     the answer data value
     * @return      {DOMElement}    The DOM element of the answer
     */
    function _recordAnswer() {
        var answerVal = _getAttr(this, oReferences.OptLblData) // @todo centralize this to remove duplication
            , dataVal = _getAttr(this, oReferences.OptValData)
            ;

        // add answer to current question
        qt.questions[currentQueston].answer = answerVal;

        _nextQuestion(this, dataVal);
        return this;
    }

    /**
     * Move to the next question
     * @param   {DOMElement}    thisQ           the DOM element of the current question
     * @param   {string}        thisAnswerData  the answer data string 
     * @return  {void}          nothing
     */
    function _nextQuestion(thisQ, thisAnswerData) {
        // hide the whole question, not just the current answer selection, call parent of the question-option displaybox which is the parentEl
        _hideEl(thisQ.parentNode.parentNode);

        var thisAnswerString = thisQ.innerHTML;

        console.log(qt.questions[currentQueston]['options'][thisAnswerData]);

        if (!qt.questions[currentQueston]['options'][thisAnswerData].nextQ) {
            //return _endAllQuestions();
            //console.log("Questionnaire Completed!")
            //return function() { window.location.reload(); };;
            //location.reload();

        }

        var nextQuestion = qt.questions[currentQueston]['options'][thisAnswerData].nextQ
            , bMoreQuestions = qt.questions[nextQuestion] ? true : false
            ;

        // if more questions are available, build the next question 
        if (bMoreQuestions) {
            _buildQuestion(nextQuestion);
            currentQueston = nextQuestion;
            // if no more questions are available, finish questionnaireTree
        } else {
            //_endAllQuestions();
            //console.log("Questionnaire Completed!")
            //location.reload();

        }
    }

    /**
     * End all questions, record the results into DOM
     * @return {void} nothin
     */
    function _endAllQuestions() {
        var sAnswersPattern = ''
            , sResultContent
            , sResultPosition
            , sClasses
            ;

        for (question in qt.questions) {
            if (qt.questions[question].answer) {
                sAnswersPattern += qt.questions[question].answer + '|';
            }
        }
        console.log(sAnswersPattern, oAnswers.patterns[sAnswersPattern]);
        // Binary question options - only matches and extracts content/position of the last question object
        let regex = /\|([^|]+)\|$/;
        let match = sAnswersPattern.match(regex);
        if (oAnswers.patterns[sAnswersPattern] && oAnswers.patterns[sAnswersPattern].content) {
            sResultContent = oAnswers.patterns[sAnswersPattern].content;
            sResultPosition = oAnswers.patterns[sAnswersPattern].position
                ? oAnswers.patterns[sAnswersPattern].position
                : 'unknown';
        }
        else if (match && oAnswers.patterns[match[1]] && oAnswers.patterns[match[1]].content) {
            sResultContent = oAnswers.patterns[match[1]].content;
            sResultPosition = oAnswers.patterns[match[1]].position
                ? oAnswers.patterns[match[1]].position
                : 'unknown';
        }
        /**
         * Enables check for specific and full pattern history for questions with multiple options
        console.log(sAnswersPattern,oAnswers.patterns[sAnswersPattern]);
        if (oAnswers.patterns[sAnswersPattern] && oAnswers.patterns[sAnswersPattern].content) {
            sResultContent = oAnswers.patterns[sAnswersPattern].content;
            sResultPosition = oAnswers.patterns[sAnswersPattern].position 
                              ? oAnswers.patterns[sAnswersPattern].position 
                              : 'unknown';
        } 
        */
        else {
            sResultContent = 'You are too unique - we have no data that matches your answers.';
            sResultPosition = 'unknown';
        }

        //console.log('questionnaireTree finished! Results:');
        //For questions with multiple options:
        //console.log(sAnswersPattern);

        //For binary questions:
        console.log(match[1]);
        console.log(sResultPosition, sResultContent);

        // if there are custom classes used in answer...
        //sClasses = oAnswers.patterns[sAnswersPattern].classes || '';
        sClasses = oAnswers.patterns[match[1]].classes || '';

        // add answer to DOM
        // var questionEl = _appendChild({
        //     elParent: elContainer,
        //     newTag: oReferences.ATag,
        //     newElID: oReferences.ATagId,
        //     elClasses: sClasses,
        //     sHTML: sResultPosition + ': ' + sResultContent
        // });

        var questionEl = _appendChild({
            elParent: elContainer,
            newTag: 'div',
            newElID: 'final-answer',
            elClasses: 'qt-question',
            sHTML: sResultPosition + ': ' + sResultContent
        });

        // Append the EERE tricolor bar to the question display box
        _appendChild({
            elParent: questionEl, // Assuming the tricolor bar should be inside questionEl but adjust as needed
            newTag: 'div',
            newElID: 'tricolor-bar',
            elClasses: 'tricolor-bar'
        });

        // Append the default WGT text above the question
        _appendChild({
            elParent: questionEl, // Use the questionEl as the parent element
            newTag: 'div',
            newElID: 'header-text',
            elClasses: 'header-text-class', // Add a class for styling
            sHTML: '<div style="text-align:center;">Does Your New Web Project Need WGT Review?</div>'
        });

        // Create and append the 'question-displaybox' div that holds customized question text
        _appendChild({
            elParent: questionEl,
            newTag: 'div',
            newElID: 'question-displaybox',
            elClasses: 'qt-displaybox',
            sHTML: 'TEST'
        });

        // Add options under 'options-displaybox' div that holds selectable options and navigation
        var optionsDisplayBox = _appendChild({
            elParent: questionEl,
            newTag: 'div',
            newElID: 'options-displaybox',
            elClasses: 'qt-options-displaybox',
        });
    }

    // DOM stuff

    /**
     * Get attribute value
     */
    function _getAttr(el, attr) {
        if (!el || !attr) {
            return console.log('No element or attribute specified!');
        }
        return el.getAttribute(attr);
    }

    /**
     * Hide element
     * @param  {DOMElement}     el  the DOM element
     * @return {DOMElement}         the DOM element to be hidden
     */
    function _hideEl(el) {
        if (el.classList.contains(oReferences.QTagActiveClass)) {
            el.classList.remove(oReferences.QTagActiveClass);
            el.classList.add(oReferences.QTagInactiveClass);
        }
        return el;
    }

    /**
     * Get element
     * @param   {string}        sel     the selector string
     * @return  {DOMElement}            the DOM selected element
     */
    function _getEl(sel) {
        if (!sel || !document.querySelectorAll(sel)) {
            return console.log('no selector');
        }
        return document.getElementById(sel);
    }

    /**
     * Append DOM element with its own features to parent element
     * @param       {object}        args                the arguments object
     * @property    {DOMElement}    args.elParent       the parent DOM element   
     * @property    {string}        args.newTag         the new HTML tag to be created  
     * @property    {string}        args.newElID        the new ID to be applied to the element being created  
     * @property    {array}         args.newElClasses   the list of classes to be added to the element being created 
     * @property    {array}         args.attribs        the list of attribute object for name and value to be added to the element being created
     * @property    {string}        args.sText          the text to be added to the DOM node 
     * @return      {DOMElement}                        the newly created DOM element 
     */
    function _appendChild(args) {
        var elParent = args.elParent
            , newTag = args.newTag
            , newElID = args.newElID
            , newEl = document.createElement(newTag)
            , newElClasses = args.elClasses
            , newElAttr = args.attribs || null
            , i = 0
            ;

        newEl.id = newElID;

        if (args.sHTML) {
            newEl.innerHTML = args.sHTML;
        } else if (args.sText) {
            var newContent = document.createTextNode(args.sText);
            //add the text node to the newly created div.
            newEl.appendChild(newContent);
        }
        if (newElClasses) {
            newEl.className = newElClasses;
        }

        // if attribute(s), iterate and add all
        if (newElAttr) {
            var newAttr
                , newElAttrLen = newElAttr.length
                ;

            for (; i < newElAttrLen; i++) {
                newAttr = document.createAttribute(newElAttr[i].aName);
                newAttr.value = newElAttr[i].aVal;
                newEl.setAttributeNode(newAttr); // set attribute
            }
        }

        elParent.appendChild(newEl);

        return newEl;
    }

    function createResetButton(optionsDisplayBox) {
        if (!optionsDisplayBox.querySelector('.reset-button')) {
            var resetBtn = document.createElement('button');
            resetBtn.innerHTML = '&#8634; Reset';
            resetBtn.classList.add('button', 'reset-button', 'poppins-regular'); // Add a specific class for styling or identifying the reset button
            resetBtn.onclick = function() { window.location.reload(); };
            optionsDisplayBox.appendChild(resetBtn);
            optionsDisplayBox.style.position = 'relative'; // To support absolute positioning of the reset button
        }
    }

};