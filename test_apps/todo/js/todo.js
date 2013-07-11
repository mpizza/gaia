'use strict';

var Todo = {
  addButton: null,
  itemList: null,
  items: [],

  init: function() {
    this.itemList = document.getElementById('item-list');
    this.addButton = document.getElementById('add');
    this.addButton.addEventListener('click', this.addItem.bind(this));
  },
  addItem: function() {
    var input = document.createElement('input');
    input.type = 'text';

    var li = document.createElement('li');
    li.appendChild(input);
    this.itemList.insertBefore(li, this.addButton);

    var self = this;
    input.addEventListener('blur',  function() {
      self.addDone(this.value, li);
    });
    input.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) 
        self.addDone(this.value, li);
    })

    input.focus();
    this.addButton.hidden = true;
  },
  addDone: function(value, li) {
    li.innerHTML = '';
    if (!value) {
      this.itemList.removeChild(li);
      this.addButton.hidden = false;
      return;
    }
    this.items.push({
      id: this.itemList.length,
      value: value
    });
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    
    var span = document.createElement('span');
    span.textContent = value;
    
    // for select user info from contact (web activity)
    var assignButton = document.createElement('input');
    assignButton.type = 'button';
    assignButton.value = '+';
    assignButton.classList.add('adduser');
    
    var assignList = document.createElement('ul'); // for assigned list
    assignList.classList.add('assignList');

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(assignButton);
    li.appendChild(assignList);

    checkbox.onclick = function() {
      if (this.checked) {
        li.classList.add('done');
      }
      else {
        li.classList.remove('done');
      }
    }

    assignButton.addEventListener('click', pickUserContact.bind(assignList));
    this.addButton.hidden = false;
  }

};

window.addEventListener('load', Todo.init.bind(Todo));

function pickUserContact() {
  var assignList = this;
  var activity = new MozActivity({
    // Ask for the "pick" activity
    name: 'pick',
    // Provide de data required by the filters of the activity
    data: {
      type: 'webcontacts/contact'
    }
  });

  activity.onsuccess = function() {
    var name = this.result.name;
    //var number = this.result.number; no use
    var li = document.createElement('li');
    li.textContent = name;
    assignList.appendChild(li);
  };

  activity.onerror = function() {
    console.log(this.error);
  };

}
