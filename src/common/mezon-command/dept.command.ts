/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { ChannelMessage } from 'mezon-sdk';

/* eslint-disable @typescript-eslint/no-unsafe-call */
export default class DeptCommand {
  static isDeptList(message = ''): boolean {
    return message?.trim() === '*listno';
  }

  static isMyDeptList(message = ''): boolean {
    return message?.trim() === '*myno';
  }

  static parseCommands(message: ChannelMessage) {
    if (!this.isValidCommandQuickCheck(message)) {
      return null;
    }
    const rawContent = this.preProcess(message);
    const parts = rawContent.replace('*doino ', '').trim().split(/\s+/);
    const timeString = parts.pop();
    const targets = parts;

    return {
      repeat: timeString,
      target:
        targets?.length === 1 && targets[0].toLowerCase() === 'all'
          ? 'all'
          : 'users',
      users: targets,
    };
  }

  static isValidCommandQuickCheck(message: ChannelMessage): boolean {
    const rawContent = message?.content?.t;
    if (!rawContent || typeof rawContent !== 'string') {
      return false;
    }
    const startWithCommand = rawContent.startsWith('*doino ');
    if (!startWithCommand) {
      return false;
    }
    const endWithTimeRegex = /\s(\d+(?:m|h|n))$/i;
    const endWithTimeMatch = rawContent.match(endWithTimeRegex);
    if (!endWithTimeMatch) {
      return false;
    }
    const timeString = endWithTimeMatch[1];
    const value = parseInt(timeString.slice(0, -1), 10);
    const unit = timeString.slice(-1).toLowerCase();
    switch (unit) {
      case 'm':
        if (value < 1 || value > 59) {
          return false;
        }
        break;
      case 'h':
        if (value < 1 || value > 23) {
          return false;
        }
        break;
      case 'n':
        if (value <= 0) {
          return false;
        }
        break;
    }

    return true;
  }

  static preProcess(message): string {
    if (!message.mentions?.length) {
      return message.content.t || '';
    }
    const rawTexts = message.content.t as string;
    const processTexts: string[] = [];
    let index = 0;
    message.mentions.forEach((mention) => {
      const { s, e, user_id } = mention;
      if (index < s) {
        processTexts.push(rawTexts.slice(index, s - 1));
      }
      processTexts.push((user_id as string) || rawTexts.slice(s, e));
      index = e + 1;
    });
    if (index < rawTexts.length) {
      processTexts.push(rawTexts.slice(index - 1));
    }
    return processTexts
      .map((t) => t.trim())
      .filter((t) => t)
      .join(' ');
  }

  static isListDeptReminder(message = ''): boolean {
    return message?.trim() === '*doino list';
  }
  static isCancelReminderCommand(message = ''): boolean {
    return message?.startsWith('*doino cancel') === true;
  }

  static parseCancelReminderCommand(message = ''): number | null {
    if (!this.isCancelReminderCommand(message)) {
      return null;
    }
    // *doino cancel
    const id = message.replace('*doino cancel', '').replace(/\s+/g, ' ').trim();
    return Number.isNaN(Number(id)) ? null : Number(id);
  }
}

// console.log('--- DeptCommand.isValidCommandQuickCheck Tests ---');
// const quickCheckTests: Array<{
//   description: string;
//   message;
//   expected: boolean;
// }> = [
//   {
//     description: 'QC1: Valid - All command',
//     message: { content: { t: '*doino all 5p' }, mentions: [] },
//     expected: true,
//   },
//   {
//     description: 'QC2: Valid - User command',
//     message: { content: { t: '*doino user1 1h' }, mentions: [] },
//     expected: true,
//   },
//   {
//     description: 'QC3: Valid - Multiple users',
//     message: { content: { t: '*doino user1 user2 2n' }, mentions: [] },
//     expected: true,
//   },
//   {
//     description: 'QC4: Valid - Mixed case time unit',
//     message: { content: { t: '*doino test 15P' }, mentions: [] },
//     expected: true,
//   },
//   {
//     description: 'QC5: Valid - Max minutes',
//     message: { content: { t: '*doino test 59p' }, mentions: [] },
//     expected: true,
//   },
//   {
//     description: 'QC6: Valid - Max hours',
//     message: { content: { t: '*doino test 23h' }, mentions: [] },
//     expected: true,
//   },
//   {
//     description: 'QC7: Valid - Min days',
//     message: { content: { t: '*doino test 1n' }, mentions: [] },
//     expected: true,
//   },
//   {
//     description: 'QC8: Invalid - No prefix',
//     message: { content: { t: 'doino all 5p' }, mentions: [] },
//     expected: false,
//   },
//   {
//     description: 'QC9: Invalid - Wrong prefix',
//     message: { content: { t: '*dino all 5p' }, mentions: [] },
//     expected: false,
//   },
//   {
//     description: 'QC10: Invalid - No space after prefix',
//     message: { content: { t: '*doinoall 5p' }, mentions: [] },
//     expected: false,
//   },
//   {
//     description: 'QC11: Invalid - Missing time unit',
//     message: { content: { t: '*doino all 5' }, mentions: [] },
//     expected: false,
//   },
//   {
//     description: 'QC12: Invalid - Time not at end',
//     message: { content: { t: '*doino 5p all' }, mentions: [] },
//     expected: false,
//   },
//   {
//     description: 'QC13: Invalid - Minutes out of range (0p)',
//     message: { content: { t: '*doino all 0p' }, mentions: [] },
//     expected: false,
//   },
//   {
//     description: 'QC14: Invalid - Hours out of range (24h)',
//     message: { content: { t: '*doino all 24h' }, mentions: [] },
//     expected: false,
//   },
//   {
//     description: 'QC15: Invalid - No target specified',
//     message: { content: { t: '*doino 5p' }, mentions: [] },
//     expected: true,
//   },
//   {
//     description: 'QC16: Invalid - Empty string',
//     message: { content: { t: '' }, mentions: [] },
//     expected: false,
//   }, // Thêm 1 test edge case
//   {
//     description:
//       'QC17: Valid - With complex mention (Quick check ignores mention structure, just looks at string format)',
//     message: {
//       content: { t: '*doino @User_Name_Mentioned 10p' },
//       mentions: [{ user_id: 'ID123', s: 8, e: 28 }],
//     },
//     expected: true,
//   },
// ];

// quickCheckTests.forEach((test) => {
//   const result = DeptCommand.isValidCommandQuickCheck(test.message);
//   console.log(
//     `${test.description} -> Expected: ${test.expected}, Got: ${result} ${result === test.expected ? '✅' : '❌'}`,
//   );
// });

// console.log('\n--- DeptCommand.preProcess Tests ---');
// const preProcessTests: Array<{
//   description: string;
//   message;
//   expected: string;
// }> = [
//     {
//       description: 'PP1: No mentions',
//       message: { content: { t: '*doino all 5p' }, mentions: [] },
//       expected: '*doino all 5p',
//     },
//     {
//       description: 'PP2: Single mention',
//       message: {
//         content: { t: '*doino @Alice 1h' },
//         mentions: [{ user_id: 'ID_ALICE', s: 8, e: 14 }],
//       },
//       expected: '*doino ID_ALICE 1h',
//     },
//     {
//       description: 'PP3: Multiple mentions',
//       message: {
//         content: { t: '*doino @Bob @Charlie 2n' },
//         mentions: [
//           { user_id: 'ID_BOB', s: 8, e: 12 },
//           { user_id: 'ID_CHARLIE', s: 13, e: 22 },
//         ],
//       },
//       expected: '*doino ID_BOB ID_CHARLIE 2n',
//     },
//     {
//       description: 'PP4: Mention with text around',
//       message: {
//         content: { t: '*doino hey @User, how are you? 3p' },
//         mentions: [{ user_id: 'ID_USER', s: 12, e: 17 }],
//       },
//       expected: '*doino hey ID_USER, how are you? 3p',
//     },
//     {
//       description: 'PP5: Mention at start of target list',
//       message: {
//         content: { t: '*doino @FirstUser secondUser 4h' },
//         mentions: [{ user_id: 'ID_FIRST', s: 8, e: 19 }],
//       },
//       expected: '*doino ID_FIRST secondUser 4h',
//     },
//     {
//       description: 'PP6: Mention at end of target list',
//       message: {
//         content: { t: '*doino firstUser @LastUser 5n' },
//         mentions: [{ user_id: 'ID_LAST', s: 19, e: 28 }],
//       },
//       expected: '*doino firstUser ID_LAST 5n',
//     },
//     {
//       description: 'PP7: Empty content, no mentions',
//       message: { content: { t: '' }, mentions: [] },
//       expected: '',
//     },
//     {
//       description:
//         'PP8: Empty content, with mentions (should not happen, but for robustness)',
//       message: {
//         content: { t: '' },
//         mentions: [{ user_id: 'ID_X', s: 0, e: 0 }],
//       },
//       expected: '',
//     },
//     {
//       description:
//         'PP9: Overlapping mentions (should be handled by sorting and careful substring, though input should ideally be non-overlapping)',
//       message: {
//         content: { t: '*doino @UserOne @UserTwo 1h' },
//         mentions: [
//           { user_id: 'ID1', s: 8, e: 16 },
//           { user_id: 'ID2', s: 13, e: 22 },
//         ],
//       }, // UserOne: 8-16, UserTwo: 13-22 -> Overlap
//       expected: '*doino ID1 ID2 1h', // Expected behavior depends on exact implementation. With current sort, it processes from right. ID2 (13-22) then ID1 (8-16)
//     },
//     {
//       description: 'PP10: Mentions with extra spaces',
//       message: {
//         content: { t: '*doino  @User   10p' },
//         mentions: [{ user_id: 'ID_U', s: 10, e: 15 }],
//       },
//       expected: '*doino ID_U 10p',
//     },
//     {
//       description: 'PP11: Mention replaces with special chars in message content',
//       message: {
//         content: { t: '*doino @abc@xyz 1m' },
//         mentions: [{ user_id: 'ID_SPECIAL', s: 8, e: 16 }],
//       },
//       expected: '*doino ID_SPECIAL 1m',
//     },
//     {
//       description: 'PP12: Mentions at very start of content',
//       message: {
//         content: { t: '@Admin doino all 1h' },
//         mentions: [{ user_id: 'ID_ADMIN', s: 0, e: 6 }],
//       },
//       expected: 'ID_ADMIN doino all 1h',
//     },
//     {
//       description: 'PP13: Mentions at very end of content',
//       message: {
//         content: { t: '*doino all @EndUser' },
//         mentions: [{ user_id: 'ID_END', s: 15, e: 23 }],
//       },
//       expected: '*doino all ID_END',
//     },
//     {
//       description: 'PP14: Complex string with multiple spaces and mentions',
//       message: {
//         content: { t: '  *doino  @UserA   and  @UserB   5p ' },
//         mentions: [
//           { user_id: 'ID_A', s: 11, e: 17 },
//           { user_id: 'ID_B', s: 26, e: 32 },
//         ],
//       },
//       expected: '*doino ID_A and ID_B 5p',
//     },
//     {
//       description: 'PP15: Mention indices are invalid (e.g. s >= e)',
//       message: {
//         content: { t: '*doino @Invalid 1h' },
//         mentions: [{ user_id: 'ID_INVALID', s: 8, e: 8 }],
//       },
//       expected: '*doino @Invalid 1h', // Invalid mention should be skipped
//     },
// ];

// preProcessTests.forEach((test) => {
//   const result = DeptCommand.preProcess(test.message);
//   console.log(
//     `${test.description} -> Expected: "${test.expected}", Got: "${result}" ${result === test.expected ? '✅' : '❌'}`,
//   );
// });

// console.log('\n--- DeptCommand.parseCommands Tests ---');
// const parseCommandsTests: Array<{
//   description: string;
//   message;
//   expected: any;
// }> = [
//   {
//     description: 'PC1: Valid - All command',
//     message: { content: { t: '*doino all 5p' }, mentions: [] },
//     expected: { repeat: '5p', target: 'all', users: ['all'] },
//   },
//   {
//     description: 'PC2: Valid - User command (no mention)',
//     message: { content: { t: '*doino user1 1h' }, mentions: [] },
//     expected: { repeat: '1h', target: 'users', users: ['user1'] },
//   },
//   {
//     description: 'PC3: Valid - User command (with mention)',
//     message: {
//       content: { t: '*doino @Alice 2n' },
//       mentions: [{ user_id: 'ID_ALICE', s: 8, e: 14 }],
//     },
//     expected: { repeat: '2n', target: 'users', users: ['ID_ALICE'] },
//   },
//   {
//     description: 'PC4: Valid - Multiple users (one mention)',
//     message: {
//       content: { t: '*doino userA @Bob 30p' },
//       mentions: [{ user_id: 'ID_BOB', s: 15, e: 19 }],
//     },
//     expected: { repeat: '30p', target: 'users', users: ['userA', 'ID_BOB'] },
//   },
//   {
//     description: 'PC5: Valid - Multiple mentions',
//     message: {
//       content: { t: '*doino @Charlie @David 15p' },
//       mentions: [
//         { user_id: 'ID_CHARLIE', s: 8, e: 16 },
//         { user_id: 'ID_DAVID', s: 17, e: 23 },
//       ],
//     },
//     expected: {
//       repeat: '15p',
//       target: 'users',
//       users: ['ID_CHARLIE', 'ID_DAVID'],
//     },
//   },
//   {
//     description: 'PC6: Valid - All command (mixed case)',
//     message: { content: { t: '*doino ALL 1h' }, mentions: [] },
//     expected: { repeat: '1h', target: 'all', users: ['ALL'] },
//   },
//   {
//     description: 'PC7: Valid - Different time units',
//     message: { content: { t: '*doino someuser 23h' }, mentions: [] },
//     expected: { repeat: '23h', target: 'users', users: ['someuser'] },
//   },
//   {
//     description: 'PC8: Invalid - No prefix (caught by QC)',
//     message: { content: { t: 'doino all 5p' }, mentions: [] },
//     expected: null,
//   },
//   {
//     description: 'PC9: Invalid - No time (caught by QC)',
//     message: { content: { t: '*doino all' }, mentions: [] },
//     expected: null,
//   },
//   {
//     description: 'PC10: Invalid - Time out of range (caught by QC)',
//     message: { content: { t: '*doino all 60p' }, mentions: [] },
//     expected: null,
//   },
//   {
//     description: 'PC11: Invalid - No target (caught by QC)',
//     message: { content: { t: '*doino 10p' }, mentions: [] },
//     expected: null,
//   },
//   {
//     description: 'PC12: Invalid - Empty message (caught by QC)',
//     message: { content: { t: '' }, mentions: [] },
//     expected: null,
//   },
//   {
//     description: 'PC13: Invalid - Only prefix (caught by QC)',
//     message: { content: { t: '*doino ' }, mentions: [] },
//     expected: null,
//   },
//   {
//     description: 'PC14: Valid - Extra spaces handled',
//     message: { content: { t: '*doino   all   20p   ' }, mentions: [] },
//     expected: { repeat: '20p', target: 'all', users: ['all'] },
//   },
//   {
//     description: 'PC15: Valid - Target contains numbers/underscores',
//     message: { content: { t: '*doino user_123 7p' }, mentions: [] },
//     expected: { repeat: '7p', target: 'users', users: ['user_123'] },
//   },
//   {
//     description:
//       'PC16: Valid - Mentions with non-alphanumeric chars (e.g., emojis)',
//     message: {
//       content: { t: '*doino @User nè 🍬 5p' },
//       mentions: [{ user_id: 'ID_USER', s: 8, e: 13 }],
//     },
//     expected: { repeat: '5p', target: 'users', users: ['ID_USER', 'nè', '🍬'] },
//   },
// ];

// parseCommandsTests.forEach((test) => {
//   const result = DeptCommand.parseCommands(test.message);
//   // Sử dụng JSON.stringify để so sánh đối tượng dễ hơn
//   const isEqual = JSON.stringify(result) === JSON.stringify(test.expected);
//   console.log(
//     `${test.description} -> Expected: ${JSON.stringify(test.expected)}, Got: ${JSON.stringify(result)} ${isEqual ? '✅' : '❌'}`,
//   );
// });
