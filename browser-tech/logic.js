'use strict';
(function(){
    const TYPE_VALUES={
        hidden:{
            attr:{
                value: 'hidden-value'
            }
        },
        text:{
            label: 'Enter some text',
            attr:{
                placeholder:'text-value'
            }
        },
        search:{
            label: 'Enter your search',
            attr: {
                placeholder:'search-string'
            }
        },
        tel:{
            label:'Phone Number',
            attr:{
                placeholder:'(nnn) nnn-nnnnn'
            }
        },
        url:{
            label: 'URL',
            attr: {
                placeholder: 'http://www.example.com',
                list: 'urls'
            }
        },
        email: {
            label: 'Email Address',
            attr: {
                placeholder: 'user@example.com',
                pattern: String(/[^@]+@[^\.]+(\.[^\.]+)+/).slice(1, -1)
            }
        },
        password: {
            label: 'Password',
        },
        date: {
            label: 'Date',
        },
        month: {
            label: 'Month Year',      
          },      
          week: {
            label: 'Week Year',      
          },
          time: {
            label: 'Time',      
          },
          datetime_local: {
            type: 'datetime-local',
            label: 'Date Time',      
          },
          number: {
            label: 'Integer',
            attr: {
          placeholder: 'nnn'
            }
          },
          range: {
            label: 'Range 1..10',
            attr: {
          min: 1,
          max: 10,
          value: 5
            }
          },
          color: {
            label: 'Color',
            attr: {
          value: '#ffff00'
            }
          },
          checkbox: {
            label: 'Select all which apply',
            values: [
          { label: 'Washer', value: 'washer' },
          { label: 'Dryer', value: 'dryer' },
          { label: 'Dishwasher', value: 'dishwasher' },
          { label: 'Refrigerator', value: 'fridge' },
          { label: 'Stove', value: 'stove' }
            ]
          },
          radio: {
            label: 'Select one',
            values: [
          { label: '1-10', value: 1 },
          { label: '10-20', value: 10 },
          { label: '20-30', value: 20 },
          { label: '30-40', value: 30 },
            ]
          },
          file: {
            label: 'Upload File',
          },      
          submit: {
            label: 'Submit',
            attr: {
          value: 'Submit'
            }
          },
          //image: 'image-value',
          reset: {
            label: 'Reset',
            attr: {
          value: 'Reset Form'
            }
          },
          button: {
            label: 'Button',
            attr: {
          value: 'Some button'
            }
          }
    }
    function changeInput($widget, info){
        if(info.values){
            let values = '';
            $(`input[name=${NAME}]:checked`).each(function(){
                values += `${$(this).val()}`;
            });
            $('#value').html(values);
        }else{
            $('#value').html($widget.val());
        }
    }
    const INPUTS_DISPLAY_ID = 'inputsDisplay';
    const NAME='widget';
    function selectInput($widget){
        $('#value').html('');
        const key = $widget.val();
        const info = TYPE_VALUES[key];
        const type = info.type || key;
        const attr = info.attr || {};
        const attributes = Object.keys(attr).map((k) => `${k} = "${attr[k]}"`).join('');
        const $displayForm = $(`#{INPUTS_DISPLAY_ID}`);
        if(info.valules){
            let html = `${info.label}<br>`;
            for(const v of info.values){
                html += 
                    `<label>
                    <input name=${NAME} type=${type} value=${v.value} $attributes>
                    ${v.label}
                    <label><br>`
            }
            $displayForm.html(html);
        }else{
            $displayForm.html(
                `<label>${info.label}:
                    <input name=${NAME} type=${type} ${attributes}>
                 </label>
                `
            );
        }
        $('label', $displayForm).css('font-weight','bold');
        $(`input[name${NAME}]`).on('change',function(ev){
            changeInput($(this),info);
        });
    }

    const INPUTS_ID = `inputs`;
    const P_SELECT_HTML = `<p>
                            <select name="inputs" id="${INPUTS_ID}">
                            <option value="">Inputs</option>
                            </select>
                          </p>`
    function addSelect(){
        const $pSelect = $(P_SELECT_HTML);
        const $select = $(`#{INPUTS_ID}`, $pSelect);
        for(const type of Object.keys(TYPE_VALUES).sort()){
            $select.append(`<option>${type}</option>`);
        }
        $select.on('change',function(ev){ selectInput($(this));
        });
        $('#inputsSelect').append($pSelect);
    }
    function setup(){
        addSelect();
    }
    $(()=>setup());
})();