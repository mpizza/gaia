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
    li.appendChild(checkbox);
    li.appendChild(span);
    checkbox.onclick = function() {
      if (this.checked) {
        li.classList.add('done');
      }
      else {
        li.classList.remove('done');
      }
    }
    this.addButton.hidden = false;
  }

};

window.addEventListener('load', Todo.init.bind(Todo));
