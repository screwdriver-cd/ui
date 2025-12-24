/* global d3 */
import groupBy from 'lodash.groupby';

const STATUS_MAP = {
  SUCCESS: { icon: '\ue903' },
  WARNING: { icon: '\ue903' },
  STARTED_FROM: { icon: '\ue907' },
  DOWNSTREAM_TRIGGER: { icon: '\ue907' },
  RUNNING: { icon: '\ue905' },
  QUEUED: { icon: '\ue904' },
  ABORTED: { icon: '\ue900' },
  FAILURE: { icon: '\ue906' },
  DISABLED: { icon: '\ue902' },
  UNKNOWN: { icon: '\ue901' },
  UNSTABLE: { icon: '\ue909' },
  BLOCKED: { icon: '\ue908' },
  COLLAPSED: { icon: '\ue908' },
  FROZEN: { icon: '\ue910' },
  SKIPPED: { icon: '\ue909' },
  VIRTUAL: { icon: '\ue911' }
};

export { STATUS_MAP };

/**
 * Find the icon to set as the text for a node
 * @method icon
 * @param  {String}   status    Text that denotes a build status
 * @param  {Boolean}  isVirtual Indicates whether the job is virtual or not
 * @return {String}        Unicode character that maps to an icon in screwdriver icon font
 */
export function icon(status, isVirtual) {
  if (
    isVirtual &&
    (!status || ['SUCCESS', 'WARNING', 'CREATED'].includes(status))
  ) {
    return STATUS_MAP.VIRTUAL.icon;
  }

  return STATUS_MAP[status] ? STATUS_MAP[status].icon : STATUS_MAP.UNKNOWN.icon;
}

/**
 * Returns the sizes of the elements in the graph.
 * @param isMinified
 * @returns {{TITLE_SIZE: number, ARROWHEAD: number, ICON_SIZE: number}|{TITLE_SIZE: number, ARROWHEAD: number, ICON_SIZE: number}}
 */
export function getElementSizes(isMinified = false) {
  const sizes = isMinified
    ? { ICON_SIZE: 12, TITLE_SIZE: 0, ARROWHEAD: 2 }
    : { ICON_SIZE: 36, TITLE_SIZE: 12, ARROWHEAD: 6 };

  sizes.STAGE_GAP = sizes.ICON_SIZE / 9;
  sizes.STAGE_GAP_HORIZONTAL = sizes.ICON_SIZE * 3;
  sizes.EDGE_GAP = Math.floor(sizes.ICON_SIZE / 6);

  return sizes;
}

/**
 * Returns the maximum length of the job name to be displayed.
 * @param data
 * @param displayJobNameLength
 * @returns {number}
 */
export function getMaximumJobNameLength(data, displayJobNameLength) {
  return Math.min(
    data.nodes.reduce(
      (max, cur) => Math.max((cur.displayName || cur.name).length, max),
      0
    ),
    displayJobNameLength
  );
}

/**
 * Returns the width of a graph node
 * @param sizes
 * @param maximumJobNameLength
 * @returns {number}
 */
export function getNodeWidth(sizes, maximumJobNameLength) {
  const { ICON_SIZE, TITLE_SIZE } = sizes;

  let width = ICON_SIZE * 2;

  // When displaying job names use estimate of 7 per character
  if (TITLE_SIZE) {
    width = Math.max(width, maximumJobNameLength * 7);
  }

  return width;
}

/**
 * Returns the horizontal column displacement for the specified column
 * @param colPosition
 * @param horizontalDisplacements
 * @returns {*|number}
 */
export function getHorizontalDisplacementByColumnPosition(
  colPosition,
  horizontalDisplacements
) {
  if (horizontalDisplacements) {
    return horizontalDisplacements[colPosition] || 0;
  }

  return 0;
}

/**
 * Returns the center of a node
 * @param nodePosition
 * @param nodeWidth
 * @param horizontalDisplacements
 * @returns {number}
 */
export function calcNodeCenter(
  nodePosition,
  nodeWidth,
  horizontalDisplacements
) {
  return (
    nodeWidth / 2 +
    nodePosition * nodeWidth +
    getHorizontalDisplacementByColumnPosition(
      nodePosition,
      horizontalDisplacements
    )
  );
}

/**
 * Returns the canvas dimensions
 * @param data
 * @param sizes
 * @param maximumJobNameLength
 * @returns {{w: number, h: number}}
 */
export function getCanvasSize(data, sizes, maximumJobNameLength) {
  return {
    w: data.meta.width * getNodeWidth(sizes, maximumJobNameLength),
    h: data.meta.height * sizes.ICON_SIZE * 2
  };
}

/**
 * Returns the vertical row displacement for the specified row
 * @param rowPosition
 * @param verticalDisplacements
 * @returns {*|number}
 */
export function getVerticalDisplacementByRowPosition(
  rowPosition,
  verticalDisplacements
) {
  if (verticalDisplacements) {
    return verticalDisplacements[rowPosition] || 0;
  }

  return 0;
}

/**
 * Calculates the Y start/end point of a line
 * @param pos
 * @param sizes
 * @param verticalDisplacements
 * @param spacer
 */
export function calcYPos(pos, sizes, verticalDisplacements, spacer = 0) {
  const { ICON_SIZE } = sizes;

  return (
    (pos + 1) * ICON_SIZE +
    (pos * spacer - ICON_SIZE / 2) +
    getVerticalDisplacementByRowPosition(pos, verticalDisplacements)
  );
}

/**
 * Calculates the x position of a stage
 * @param stage
 * @param nodeWidth
 * @param sizes
 * @returns {*}
 */
export function calcStageX(stage, nodeWidth, sizes, horizontalDisplacements) {
  return (
    stage.pos.x * nodeWidth +
    sizes.STAGE_GAP +
    getHorizontalDisplacementByColumnPosition(
      stage.pos.x,
      horizontalDisplacements
    )
  );
}

/**
 * Calculates the y position of a stage
 * @param stage
 * @param sizes
 * @param verticalDisplacements
 * @param yDisplacement
 * @returns {*}
 */
export function calcStageY(
  stage,
  sizes,
  verticalDisplacements,
  yDisplacement = 0
) {
  const { ICON_SIZE, STAGE_GAP } = sizes;

  return (
    calcYPos(stage.pos.y, sizes, verticalDisplacements, ICON_SIZE) -
    ICON_SIZE / 2 -
    yDisplacement +
    STAGE_GAP
  );
}

/**
 * Returns the vertical displacement for the stages spanning the specified rows
 * @param startRow
 * @param endRow
 * @param stageVerticalDisplacements
 * @returns {number}
 */
export function getStageVerticalDisplacementByRowPosition(
  startRow,
  endRow,
  stageVerticalDisplacements
) {
  let yDisplacement = 0;

  for (let i = startRow; i <= endRow; i += 1) {
    yDisplacement += getVerticalDisplacementByRowPosition(
      i,
      stageVerticalDisplacements
    );
  }

  return yDisplacement;
}

/**
 * Returns the horizontal displacement within the stage
 * @param startColumn
 * @param endColumn
 * @param horizontalDisplacements
 * @returns {number}
 */
export function getStageHorizontalDisplacementByColumnPosition(
  startColumn,
  endColumn,
  horizontalDisplacements
) {
  return (
    getHorizontalDisplacementByColumnPosition(
      endColumn,
      horizontalDisplacements
    ) -
    getHorizontalDisplacementByColumnPosition(
      startColumn,
      horizontalDisplacements
    )
  );
}

/**
 * Calculates the width of a stage
 * @param stage
 * @param nodeWidth
 * @param sizes
 * @param horizontalDisplacements
 * @returns {number}
 */
export function calcStageWidth(
  stage,
  nodeWidth,
  sizes,
  horizontalDisplacements
) {
  const xDisplacement = horizontalDisplacements
    ? getStageHorizontalDisplacementByColumnPosition(
        stage.pos.x,
        stage.pos.x + stage.graph.meta.width - 1,
        horizontalDisplacements
      )
    : 0;

  return stage.graph.meta.width * nodeWidth - sizes.STAGE_GAP + xDisplacement;
}

/**
 * Calculates the height of a stage
 * @param stage
 * @param sizes
 * @param stageVerticalDisplacements
 * @returns {number}
 */
export function calcStageHeight(stage, sizes, stageVerticalDisplacements = 0) {
  const yDisplacement = stageVerticalDisplacements
    ? getStageVerticalDisplacementByRowPosition(
        stage.pos.y,
        stage.pos.y + stage.graph.meta.height - 1,
        stageVerticalDisplacements
      )
    : 0;

  const { ICON_SIZE, STAGE_GAP } = sizes;

  return 2 * ICON_SIZE * stage.graph.meta.height - STAGE_GAP + yDisplacement;
}

/**
 * Calculates the y center position of a stage
 * @param stage
 * @param sizes
 * @param verticalDisplacements
 * @param yDisplacement
 * @returns {number}
 */
export function calcStageYCenter(
  stage,
  sizes,
  verticalDisplacements,
  yDisplacement = 0
) {
  return (
    calcStageY(stage, sizes, verticalDisplacements, yDisplacement) +
    calcStageHeight(stage, sizes) / 2
  );
}

/**
 * Returns the vertical displacements due to stages
 * @param data
 * @param sizes
 * @param stageNameVerticalDisplacements
 * @returns {{stageVerticalDisplacements: {}, verticalDisplacements: {}}}
 */
export function getVerticalDisplacements(
  data,
  sizes,
  stageNameVerticalDisplacements
) {
  const stagesGroupedByRowPosition = groupBy(data.stages, 'pos.y');

  const verticalDisplacements = {};
  const stageVerticalDisplacements = {};

  for (let i = 0; i < data.meta.height; i += 1) {
    const stages = stagesGroupedByRowPosition[i];

    if (stages === undefined) {
      stageVerticalDisplacements[i] = 0;
      verticalDisplacements[i] = i === 0 ? 0 : verticalDisplacements[i - 1];
    } else {
      const maxDisplacement = Math.max(
        ...stages.map(s => stageNameVerticalDisplacements[s.name])
      );

      stageVerticalDisplacements[i] = maxDisplacement;
      verticalDisplacements[i] =
        maxDisplacement +
        (i === 0 ? sizes.ICON_SIZE / 2 : verticalDisplacements[i - 1]);
    }
  }

  return {
    verticalDisplacements,
    stageVerticalDisplacements
  };
}

/**
 * Returns the horizontal displacements due to stages
 * @param data
 * @param sizes
 * @returns {{stageVerticalDisplacements: {}, verticalDisplacements: {}}}
 */
export function getHorizontalDisplacements(data, sizes) {
  const stagesGroupedByStartColumnPosition = groupBy(data.stages, 'pos.x');

  const columnsToBeDisplaced = {};

  data.stages.forEach(s => {
    const stageEndPosX = s.pos.x + s.graph.meta.width - 1;

    if (stagesGroupedByStartColumnPosition[stageEndPosX + 1]) {
      columnsToBeDisplaced[stageEndPosX + 1] = true;
    }
  });

  const horizontalDisplacements = {};

  for (let i = 0; i < data.meta.width; i += 1) {
    const shouldColumnBeDisplaced = columnsToBeDisplaced[i];

    if (shouldColumnBeDisplaced) {
      horizontalDisplacements[i] =
        horizontalDisplacements[i - 1] + sizes.STAGE_GAP_HORIZONTAL;
    } else {
      horizontalDisplacements[i] = i === 0 ? 0 : horizontalDisplacements[i - 1];
    }
  }

  return horizontalDisplacements;
}

/**
 * Adds stages to the graph, additionally returns the vertical displacements due to stages
 * @param svg
 * @param data
 * @param sizes
 * @param nodeWidth
 * @param onStageMenuHandleClick
 * @param displayStageMenuHandle
 * @returns {{}}
 */
export function addStages(
  svg,
  data,
  sizes,
  nodeWidth,
  onStageMenuHandleClick,
  displayStageMenuHandle,
  onStageViewToggleClick
) {
  const { TITLE_SIZE } = sizes;

  const stageNameDisplacementMap = {};
  const stageNameToStageElementsMap = {};

  const horizontalDisplacements = getHorizontalDisplacements(data, sizes);

  data.stages.forEach(stage => {
    // stage container
    const stageContainer = svg
      .append('rect')
      .attr('data-stage', stage.name)
      .attr(
        'class',
        stage.status
          ? `stage-container build-${stage.status.toLowerCase()}`
          : 'stage-container'
      )
      .attr('x', calcStageX(stage, nodeWidth, sizes, horizontalDisplacements))
      .attr('y', calcStageY(stage, sizes))
      .attr(
        'width',
        calcStageWidth(stage, nodeWidth, sizes, horizontalDisplacements)
      )
      .attr('height', calcStageHeight(stage, sizes))
      .attr('stroke', 'grey')
      .attr('fill', '#ffffff')
      .attr('rx', 5) // Add rx attribute for rounded corners
      .attr('ry', 5); // Add ry attribute for rounded corners

    // stage info
    const fo = svg
      .append('foreignObject')
      .attr(
        'width',
        calcStageWidth(stage, nodeWidth, sizes, horizontalDisplacements)
      )
      .attr('height', 0) // Actual height will be computed and set later
      .attr('x', calcStageX(stage, nodeWidth, sizes, horizontalDisplacements))
      .attr('y', calcStageY(stage, sizes))
      .attr('class', `stage-info-wrapper _stage_${stage.name}`);

    const stageInfo = fo.append('xhtml:div').attr('class', 'stage-info');

    // stage info - name
    const stageTitle = stageInfo
      .append('div')
      .attr('class', 'stage-title')
      .style('font-size', `${TITLE_SIZE}px`);

    const isStageCollapsed = stage.isCollapsed;

    // stage expand/collapse toggle button
    stageTitle
      .append('span')
      .html(isStageCollapsed ? '+' : '-')
      .attr(
        'title',
        isStageCollapsed ? 'Expand the stage' : 'Collapse the stage'
      )
      .attr('class', 'stage-view-toggle')
      .style('font-size', `${TITLE_SIZE}px`)
      .on('click', () => {
        onStageViewToggleClick(stage.name, !isStageCollapsed);
      });

    // stage info - name
    stageTitle
      .append('span')
      .html(stage.name)
      .attr('title', stage.name)
      .attr('class', 'stage-name')
      .style('font-size', `${TITLE_SIZE}px`);

    if (displayStageMenuHandle) {
      const stageActions = stageTitle
        .append('div')
        .attr('title', 'Stage actions')
        .attr('class', 'stage-actions');

      stageActions
        .append('div')
        .html('...')
        .attr('title', 'Stage menu')
        .attr('class', 'stage-menu-handle')
        .on('click', () => {
          onStageMenuHandleClick(stage);
        });
    }

    // stage info - description
    if (stage.description && stage.description.length > 0) {
      stageInfo
        .append('div')
        .html(stage.description)
        .attr('class', 'stage-description')
        .style('font-size', `${TITLE_SIZE}px`);
    }

    stageNameDisplacementMap[stage.name] = stageInfo
      .node()
      .getBoundingClientRect().height;
    stageNameToStageElementsMap[stage.name] = {
      stageContainer,
      stageInfoWrapper: fo
    };
  });

  const { verticalDisplacements, stageVerticalDisplacements } =
    getVerticalDisplacements(data, sizes, stageNameDisplacementMap);

  // Adjust height and position of SVG and stage elements
  data.stages.forEach(stage => {
    const yDisplacement = stageNameDisplacementMap[stage.name];

    const { stageContainer, stageInfoWrapper } =
      stageNameToStageElementsMap[stage.name];

    stageInfoWrapper.attr('height', yDisplacement);
    stageInfoWrapper.attr(
      'y',
      calcStageY(stage, sizes, verticalDisplacements, yDisplacement)
    );

    stageContainer.attr(
      'height',
      calcStageHeight(stage, sizes, stageVerticalDisplacements)
    );
    stageContainer.attr(
      'y',
      calcStageY(stage, sizes, verticalDisplacements, yDisplacement)
    );
  });

  svg.attr(
    'height',
    Number.parseInt(svg.attr('height'), 10) +
      getVerticalDisplacementByRowPosition(
        data.meta.height - 1,
        verticalDisplacements
      )
  );

  svg.attr(
    'width',
    Number.parseInt(svg.attr('width'), 10) +
      getHorizontalDisplacementByColumnPosition(
        data.meta.width - 1,
        horizontalDisplacements
      )
  );

  return {
    verticalDisplacements,
    horizontalDisplacements
  };
}

/**
 * Adds edges to the graph
 * @param svg
 * @param data
 * @param sizes
 * @param nodeWidth
 * @param isSkipped
 * @param verticalDisplacements
 */
export function addEdges( // eslint-disable-line max-params
  svg,
  data,
  sizes,
  nodeWidth,
  isSkipped,
  verticalDisplacements,
  horizontalDisplacements
) {
  const { ICON_SIZE, EDGE_GAP, ARROWHEAD } = sizes;
  const edgesToDraw = data.edges.filter(e => {
    return e.hidden !== true;
  });

  svg
    .selectAll('link')
    .data(edgesToDraw)
    .enter()
    .append('path')
    .attr('class', d =>
      isSkipped
        ? 'graph-edge node-edge build-skipped'
        : `graph-edge node-edge ${
            d.status ? `build-${d.status.toLowerCase()}` : ''
          }`
    )
    .attr('stroke-dasharray', d => (!d.status || isSkipped ? 5 : 0))
    .attr('stroke-width', 2)
    .attr('fill', 'transparent')
    .attr('d', d => {
      const path = d3.path();
      const startX =
        calcNodeCenter(d.from.x, nodeWidth, horizontalDisplacements) +
        ICON_SIZE / 2 +
        EDGE_GAP;
      const startY = calcYPos(
        d.from.y,
        sizes,
        verticalDisplacements,
        ICON_SIZE
      );
      const endX =
        calcNodeCenter(d.to.x, nodeWidth, horizontalDisplacements) -
        ICON_SIZE / 2 -
        EDGE_GAP;
      const endY = calcYPos(d.to.y, sizes, verticalDisplacements, ICON_SIZE);

      path.moveTo(startX, startY);
      // curvy line
      path.bezierCurveTo(endX, startY, endX - nodeWidth / 2, endY, endX, endY);
      // arrowhead
      path.lineTo(endX - ARROWHEAD, endY - ARROWHEAD);
      path.moveTo(endX, endY);
      path.lineTo(endX - ARROWHEAD, endY + ARROWHEAD);

      return path;
    });
}

/**
 * Adds stage edges to the graph
 * @param svg
 * @param data
 * @param sizes
 * @param nodeWidth
 * @param isSkipped
 * @param verticalDisplacements
 */
export function addStageEdges( // eslint-disable-line max-params
  svg,
  data,
  sizes,
  nodeWidth,
  isSkipped,
  verticalDisplacements,
  horizontalDisplacements
) {
  const { ICON_SIZE, EDGE_GAP, ARROWHEAD } = sizes;

  svg
    .selectAll('link')
    .data(data.stageEdges)
    .enter()
    .append('path')
    .attr('class', d =>
      isSkipped
        ? 'graph-edge stage-edge build-skipped'
        : `graph-edge stage-edge ${
            d.status ? `build-${d.status.toLowerCase()}` : ''
          }`
    )
    .attr('stroke-dasharray', d => (!d.status || isSkipped ? 5 : 0))
    .attr('stroke-width', 2)
    .attr('fill', 'transparent')
    .attr('d', d => {
      const path = d3.path();

      let startX;

      let startY;

      if (d.srcStageName) {
        const stage = d.from;

        startX =
          calcStageX(stage, nodeWidth, sizes, horizontalDisplacements) +
          calcStageWidth(stage, nodeWidth, sizes, horizontalDisplacements);

        startY = calcStageYCenter(stage, sizes, verticalDisplacements);
      } else {
        startX =
          calcNodeCenter(d.from.pos.x, nodeWidth) + ICON_SIZE / 2 + EDGE_GAP;
        startY = calcYPos(
          d.from.pos.y,
          sizes,
          verticalDisplacements,
          ICON_SIZE
        );
      }

      let endX;

      let endY;

      if (d.destStageName) {
        const stage = d.to;

        endX = calcStageX(stage, nodeWidth, sizes, horizontalDisplacements);
        endY = calcStageYCenter(stage, sizes, verticalDisplacements);
      } else {
        endX =
          calcNodeCenter(d.to.pos.x, nodeWidth, horizontalDisplacements) -
          ICON_SIZE / 2 -
          EDGE_GAP;
        endY = calcYPos(d.to.pos.y, sizes, verticalDisplacements, ICON_SIZE);
      }

      path.moveTo(startX, startY);
      // curvy line
      path.bezierCurveTo(endX, startY, endX - nodeWidth / 2, endY, endX, endY);
      // arrowhead
      path.lineTo(endX - ARROWHEAD, endY - ARROWHEAD);
      path.moveTo(endX, endY);
      path.lineTo(endX - ARROWHEAD, endY + ARROWHEAD);

      return path;
    });
}

/**
 * Adds job icons to the graph
 * @param svg
 * @param data
 * @param sizes
 * @param nodeWidth
 * @param verticalDisplacements
 * @param horizontalDisplacements
 * @param isSkipped
 * @param onClick
 */
export function addJobIcons( // eslint-disable-line max-params
  svg,
  data,
  sizes,
  nodeWidth,
  verticalDisplacements,
  horizontalDisplacements,
  isSkipped,
  onClick
) {
  const { ICON_SIZE } = sizes;

  const nodeGroups = svg
    .selectAll('jobs')
    .data(data.nodes)
    .enter()
    // for each element in data array - do the following
    // create a group element to animate
    .append('g')
    .attr('class', d => {
      if (isSkipped && d.status === 'STARTED_FROM') {
        return 'graph-node build-skipped';
      }

      const virtualClass = d.virtual ? ' virtual' : '';

      return `graph-node${virtualClass}$${
        d.status ? ` build-${d.status.toLowerCase()}` : ''
      }`.replace('$', '');
    })
    .attr('data-job', d => d.name)
    .on('click', node => {
      onClick(node);
    });

  // create the icon graphic
  nodeGroups
    .append('text')
    .text(d => {
      if (isSkipped && d.status === 'STARTED_FROM') {
        return icon('SKIPPED');
      }

      return icon(d.status, d.virtual);
    })
    .attr('font-size', d => {
      return `${
        icon(d.status, d.virtual) === STATUS_MAP.VIRTUAL.icon
          ? ICON_SIZE * 2
          : ICON_SIZE
      }px`;
    })
    .style('text-anchor', 'middle')
    .attr('x', d => {
      return (
        calcNodeCenter(d.pos.x, nodeWidth, horizontalDisplacements) +
        (icon(d.status, d.virtual) === STATUS_MAP.VIRTUAL.icon
          ? ICON_SIZE / 2
          : 0)
      );
    })
    .attr(
      'y',
      d =>
        (d.pos.y + 1) * ICON_SIZE +
        d.pos.y * ICON_SIZE +
        getVerticalDisplacementByRowPosition(d.pos.y, verticalDisplacements)
    );

  nodeGroups.append('title').text(d => {
    const name = d.remoteName !== undefined ? d.remoteName : d.name;

    return d.status ? `${name} - ${d.status}` : name;
  });
}

/**
 * Adds job names to the graph
 * @param svg
 * @param data
 * @param sizes
 * @param maximumJobNameLength
 * @param verticalDisplacements
 */
export function addJobNames(
  svg,
  data,
  sizes,
  maximumJobNameLength,
  verticalDisplacements,
  horizontalDisplacements
) {
  const { ICON_SIZE, TITLE_SIZE } = sizes;
  const nodeWidth = getNodeWidth(sizes, maximumJobNameLength);
  const edgeGap = Math.floor(ICON_SIZE / 6);

  svg
    .selectAll('jobslabels')
    .data(data.nodes)
    .enter()
    .append('text')
    .text(d => {
      const displayName = d.displayName !== undefined ? d.displayName : d.name;

      return displayName.length > maximumJobNameLength
        ? `${displayName.substring(0, 8)}...${displayName.slice(-8)}`
        : displayName;
    })
    .attr('class', 'graph-label')
    .attr('font-size', `${TITLE_SIZE}px`)
    .each(function () {
      const text = d3.select(this);
      const textWidth = text.node().getBBox().width;
      const maxWidth = nodeWidth - edgeGap / 2;

      if (textWidth > maxWidth) {
        const fontSize = (TITLE_SIZE * maxWidth) / textWidth; // calculate the new font-size based on the maximum width

        text.style('font-size', `${fontSize}px`);
      }
    })
    .style('text-anchor', 'middle')
    .attr('x', d => calcNodeCenter(d.pos.x, nodeWidth, horizontalDisplacements))
    .attr(
      'y',
      d =>
        (2 * d.pos.y + 1) * ICON_SIZE +
        TITLE_SIZE +
        getVerticalDisplacementByRowPosition(d.pos.y, verticalDisplacements)
    )
    .insert('title')
    .text(d => {
      return d.remoteName !== undefined ? d.remoteName : d.name;
    });
}

/**
 * Updates the job statuses in the existing graph SVG
 * @param svg
 * @param data
 * @param sizes
 * @param nodeWidth
 */
export function updateJobStatuses(svg, data, sizes, nodeWidth) {
  const { ICON_SIZE } = sizes;

  svg
    .selectAll('.graph-node')
    .data(data.nodes)
    .join()
    .attr('class', node => {
      const virtualClass = node.virtual ? ' virtual' : '';

      return `graph-node${virtualClass}${
        node.status ? ` build-${node.status.toLowerCase()}` : ''
      }`;
    })
    .attr('font-size', node => {
      return `${
        icon(node.status, node.virtual) === STATUS_MAP.VIRTUAL.icon
          ? ICON_SIZE * 2
          : ICON_SIZE
      }px`;
    })
    .attr('x', node => {
      return (
        calcNodeCenter(node.pos.x, nodeWidth) +
        (icon(node.status, node.virtual) === STATUS_MAP.VIRTUAL.icon
          ? ICON_SIZE / 2
          : 0)
      );
    })
    .select('text')
    .html(node => {
      return icon(node.status, node.virtual);
    });
}

/**
 * Updates the edge statuses in the existing graph SVG
 * @param svg
 * @param data
 */
export function updateEdgeStatuses(svg, data) {
  svg
    .selectAll('.graph-edge.node-edge')
    .data(data.edges)
    .join()
    .attr('class', edge => {
      return `graph-edge node-edge ${
        edge.status ? `build-${edge.status.toLowerCase()}` : ''
      }`;
    })
    .attr('stroke-dasharray', edge => {
      return !edge.status ? 5 : 0;
    });
}

/**
 * Updates the edge statuses in the existing graph SVG
 * @param svg
 * @param data
 */
export function updateStageEdgeStatuses(svg, data) {
  svg
    .selectAll('.graph-edge.stage-edge')
    .data(data.stageEdges)
    .join()
    .attr('class', edge => {
      return `graph-edge stage-edge ${
        edge.status ? `build-${edge.status.toLowerCase()}` : ''
      }`;
    })
    .attr('stroke-dasharray', edge => {
      return !edge.status ? 5 : 0;
    });
}

/**
 * Updates the stage statuses in the existing graph SVG
 * @param svg
 * @param data
 */
export function updateStageStatuses(svg, data) {
  svg
    .selectAll('.stage-container')
    .data(data.stages)
    .join()
    .attr('class', stage => {
      return stage.status
        ? `stage-container build-${stage.status.toLowerCase()}`
        : 'stage-container';
    });
}

/**
 * Returns the SVG element for the graph.
 * @param element
 * @param data
 * @param sizes
 * @param maximumJobNameLength
 * @param onClick
 * @returns {*}
 */
export function getGraphSvg(
  element,
  data,
  sizes,
  maximumJobNameLength,
  onClick
) {
  // Calculate the canvas size based on amount of content
  const { w, h } = getCanvasSize(data, sizes, maximumJobNameLength);

  return d3
    .select(element)
    .append('svg')
    .attr('width', w)
    .attr('height', h)
    .on(
      'click',
      node => {
        onClick(node);
      },
      true
    );
}
