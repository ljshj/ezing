/*
 * Copyright (C) 2015 Actor LLC. <https://actor.im>
 */

import { map } from 'lodash';

import React, { Component } from 'react';
import { Container } from 'flux/utils';
import Modal from 'react-modal';
import classnames from 'classnames';
import isInside from 'utils/isInside';

import { KeyCodes } from 'constants/ActorAppConstants';

import FastSwitcherActionCreators from 'actions/FastSwitcherActionCreators';
import DialogActionCreators from 'actions/DialogActionCreators';

import FastSwitcherStore from 'stores/FastSwitcherStore';

import AvatarItem from 'components/common/AvatarItem.react';

const RESULT_ITEM_HEIGHT = 44;
let scrollIndex = 0;

class FastSwitcher extends Component {
  static getStores = () => [FastSwitcherStore];

  static calculateState() {
    return {
      isOpen: FastSwitcherStore.isOpen(),
      results: FastSwitcherStore.getResults(),
      selectedIndex: 0
    }
  }

  componentDidMount() {
    this.setFocus();
    document.addEventListener('keydown', this.handleKeyDown, false);
    document.addEventListener('click', this.handleDocumentClick, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown, false);
    document.removeEventListener('click', this.handleDocumentClick, false);
  }

  render() {
    const { isOpen, results, selectedIndex } = this.state;

    const resultsList = map(results, (result, index) => {
      const resultClassName = classnames('results__item row', {
        'results__item--active': selectedIndex === index,
        'results__item--contact': result.type === 'CONTACT',
        'results__item--dialog': result.type === 'DIALOG',
        'results__item--suggestion': result.type === 'SUGGESTION'
      });

      switch (result.type) {
        case 'DIALOG':
          return (
            <li className={resultClassName}
                key={index}
                onClick={() => this.handleDialogSelect(result.dialog.peer.peer)}
                onMouseOver={() => this.setState({selectedIndex: index})}>
              <AvatarItem image={result.dialog.peer.avatar}
                          placeholder={result.dialog.peer.placeholder}
                          size="small"
                          title={result.dialog.peer.title}/>
              <div className="title col-xs">
                {result.dialog.peer.title}
                <div className="hint pull-right">开始对话</div>
              </div>
            </li>
          );
        case 'CONTACT':
          return (
            <li className={resultClassName}
                key={index}
                onClick={() => this.handleContactSelect(result.contact.uid)}
                onMouseOver={() => this.setState({selectedIndex: index})}>
              <AvatarItem image={result.contact.avatar}
                          placeholder={result.contact.placeholder}
                          size="small"
                          title={result.contact.name}/>
              <div className="title col-xs">
                {result.contact.name}
                <div className="hint pull-right">开始对话</div>
              </div>

            </li>
          );
        case 'SUGGESTION':
          return (
            <li className={resultClassName}
                key={index}>

              <span>未找到<strong>{result.query}</strong>.</span>
              <span>是否输入错误?</span>
              <button className="button button--rised hide">与{result.query}开始新的对话</button>

            </li>
          );
      }

    });

    if (isOpen) {
      return (
        <Modal className="modal modal--fast-switcher"
               closeTimeoutMS={150}
               isOpen={isOpen}
               style={{width: 400}}>
          <div ref="modal">

            <header className="header">
              <div className="pull-left">快速跳转</div>
              <div className="pull-right"><strong>esc</strong>&nbsp; 关闭</div>
              <div className="pull-right"><strong>↵</strong>&nbsp; 选择</div>
              <div className="pull-right"><strong>tab</strong>&nbsp; 或 &nbsp;<strong>↑</strong><strong>↓</strong>&nbsp; 浏览</div>
            </header>

            <div className="input">
              <input type="text"
                     placeholder=""
                     onChange={this.handleSearch}
                     ref="query"/>
            </div>

            <ul className="results" ref="results">
              {resultsList}
            </ul>

          </div>
        </Modal>
      );
    } else {
      return null;
    }
  }

  setFocus = () => {
    setTimeout(() => {
      React.findDOMNode(this.refs.query).focus();
    }, 0);
  };

  handleClose = () => FastSwitcherActionCreators.hide();

  handleSearch = (event) => FastSwitcherActionCreators.search(event.target.value);

  handleDialogSelect = (peer) => {
    DialogActionCreators.selectDialogPeer(peer);
    this.handleClose();
  };

  handleContactSelect = (uid) => {
    DialogActionCreators.selectDialogPeerUser(uid);
    this.handleClose();
  };

  handleKeyDown = (event) => {
    const { results, selectedIndex } = this.state;
    const visibleItems = 8;
    let index = selectedIndex;

    switch (event.keyCode) {
      case KeyCodes.ENTER:
        event.stopPropagation();
        event.preventDefault();
        if (results[selectedIndex].type === 'DIALOG') {
          this.handleDialogSelect(results[selectedIndex].dialog.peer.peer);
        } else if (results[selectedIndex].type === 'CONTACT') {
          this.handleContactSelect(results[selectedIndex].contact.uid);
        }
        break;

      case KeyCodes.ARROW_UP:
        event.stopPropagation();
        event.preventDefault();

        if (index > 0) {
          index -= 1;
        } else if (index === 0) {
          index = results.length - 1;
        }

        if (scrollIndex > index) {
          scrollIndex = index;
        } else if (index === results.length - 1) {
          scrollIndex = results.length - visibleItems;
        }

        this.handleScroll(scrollIndex * RESULT_ITEM_HEIGHT);
        this.setState({selectedIndex: index});
        break;
      case KeyCodes.ARROW_DOWN:
      case KeyCodes.TAB:
        event.stopPropagation();
        event.preventDefault();

        if (index < results.length - 1) {
          index += 1;
        } else if (index === results.length - 1) {
          index = 0;
        }

        if (index + 1 > scrollIndex + visibleItems) {
          scrollIndex = index + 1 - visibleItems;
        } else if (index === 0) {
          scrollIndex = 0;
        }

        this.handleScroll(scrollIndex * RESULT_ITEM_HEIGHT);
        this.setState({selectedIndex: index});
        break;

      case KeyCodes.ESC:
        event.preventDefault();
        this.handleClose();
        break;

      default:
    }
  };

  handleScroll = (top) => {
    const resultsNode = React.findDOMNode(this.refs.results);
    resultsNode.scrollTop = top;
  };

  handleDocumentClick = (event) => {
    const modal = React.findDOMNode(this.refs.modal);
    const modalRect = modal.getBoundingClientRect();
    const coords = {
      x: event.pageX || event.clientX,
      y: event.pageY || event.clientY
    };

    if (!isInside(coords, modalRect)) {
      this.handleClose();
    }
  };
}

export default Container.create(FastSwitcher, {pure: false});
