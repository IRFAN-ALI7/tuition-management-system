
import type { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";

import Attendance from "../../models/Attendance.model";
import Batch from "../../models/Batch.model";
import Student from "../../models/Student.model";

import {
  durationMinutes,
  isTime,
  normalizeText,
} from "../../utils/normalization";

const serialize = (batch: any) => ({
  _id: batch._id,
  name: batch.name,
  startTime: batch.startTime,
  endTime: batch.endTime,
  durationMinutes: durationMinutes(batch.startTime, batch.endTime),
  active: batch.active,
  students: batch.students ?? [],
  createdAt: batch.createdAt,
});

// GET /
export async function getAllBatches(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const query =
      request.query.includeInactive === "true"
        ? {}
        : { active: true };

    const [
      batches,
      totalBatches,
      activeBatches,
      totalStudents,
    ] = await Promise.all([
      Batch.find(query).sort({ startTime: 1, name: 1 }).lean(),
      Batch.countDocuments(),
      Batch.countDocuments({ active: true }),
      Student.countDocuments(),
    ]);

    const ids = batches.map((batch) => batch._id);

    const students = await Student.find({
      batchId: { $in: ids },
    })
      .select("name phone fatherName batchId active")
      .sort({ name: 1 })
      .lean();

    const byBatch = new Map<string, typeof students>();

    for (const student of students) {
      const key = String(student.batchId);

      byBatch.set(key, [
        ...(byBatch.get(key) ?? []),
        student,
      ]);
    }

    response.json({
      batches: batches.map((batch) =>
        serialize({
          ...batch,
          students: byBatch.get(String(batch._id)) ?? [],
        })
      ),
      summary: {
        totalBatches,
        activeBatches,
        totalStudents,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /
export async function createBatch(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const {
      name,
      startTime,
      endTime,
      studentIds = [],
    } = request.body as Record<string, unknown>;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !isTime(startTime) ||
      !isTime(endTime) ||
      !durationMinutes(startTime, endTime) ||
      !Array.isArray(studentIds) ||
      studentIds.some(
        (id) => typeof id !== "string" || !isValidObjectId(id)
      )
    ) {
      response.status(400).json({
        error:
          "Enter a batch name and valid start and end times. End time must be after start time.",
      });
      return;
    }

    const nameKey = normalizeText(name);

    if (await Batch.exists({ nameKey })) {
      response.status(409).json({
        error: "A batch with this name already exists.",
      });
      return;
    }

    const ids = [...new Set(studentIds as string[])];

    const students = await Student.find({
      _id: { $in: ids },
      active: true,
    })
      .select("_id batchId")
      .populate("batchId", "active");

    if (students.length !== ids.length) {
      response.status(400).json({
        error:
          "One or more selected students are missing or inactive.",
      });
      return;
    }

    const alreadyAssigned = students.filter(
      (student) =>
        student.batchId &&
        (student.batchId as unknown as { active?: boolean }).active !==
          false
    );

    if (alreadyAssigned.length) {
      response.status(409).json({
        error:
          "Some selected students already belong to a batch. Remove or reassign them from their current batch first.",
        studentIds: alreadyAssigned.map((student) =>
          String(student._id)
        ),
      });
      return;
    }

    const batch = await Batch.create({
      name: name.trim().replace(/\s+/g, " "),
      nameKey,
      startTime,
      endTime,
      active: true,
    });

    const movedStudents: {
      id: unknown;
      previousBatchId: unknown;
    }[] = [];

    if (ids.length) {
      for (const student of students) {
        const oldBatchId = student.batchId
          ? (student.batchId as unknown as { _id: unknown })._id
          : null;

        const result = await Student.updateOne(
          {
            _id: student._id,
            batchId: oldBatchId,
          },
          {
            $set: { batchId: batch._id },
          }
        );

        if (!result.modifiedCount) {
          for (const moved of movedStudents) {
            await Student.updateOne(
              {
                _id: moved.id,
                batchId: batch._id,
              },
              {
                $set: {
                  batchId: moved.previousBatchId,
                },
              }
            );
          }

          await batch.deleteOne();

          response.status(409).json({
            error:
              "A selected student was assigned to another batch at the same time. Reload and try again.",
          });
          return;
        }

        movedStudents.push({
          id: student._id,
          previousBatchId: oldBatchId,
        });
      }
    }

    const assigned = await Student.find({
      batchId: batch._id,
    })
      .select("name phone fatherName batchId active")
      .lean();

    response.status(201).json({
      batch: serialize({
        ...batch.toObject(),
        students: assigned,
      }),
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      response.status(409).json({
        error: "A batch with this name already exists.",
      });
      return;
    }

    next(error);
  }
}

// PATCH /:id
export async function updateBatch(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const id = Array.isArray(request.params.id)
      ? request.params.id[0]
      : request.params.id;

    if (!isValidObjectId(id)) {
      response.status(400).json({
        error: "Invalid batch ID.",
      });
      return;
    }

    const {
      name,
      startTime,
      endTime,
      studentIds,
    } = request.body as Record<string, unknown>;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      response.status(400).json({
        error: "Batch name is required.",
      });
      return;
    }

    if (
      (startTime !== undefined && !isTime(startTime)) ||
      (endTime !== undefined && !isTime(endTime))
    ) {
      response.status(400).json({
        error: "Times must use 24-hour HH:mm format.",
      });
      return;
    }

    if (
      studentIds !== undefined &&
      (!Array.isArray(studentIds) ||
        studentIds.some(
          (studentId) =>
            typeof studentId !== "string" ||
            !isValidObjectId(studentId)
        ))
    ) {
      response.status(400).json({
        error: "Student IDs are invalid.",
      });
      return;
    }

    const batch = await Batch.findById(id);

    if (!batch) {
      response.status(404).json({
        error: "Batch not found.",
      });
      return;
    }

    const nextName =
      typeof name === "string"
        ? name.trim().replace(/\s+/g, " ")
        : batch.name;

    const nameKey = normalizeText(nextName);

    if (
      await Batch.exists({
        _id: { $ne: batch._id },
        nameKey,
      })
    ) {
      response.status(409).json({
        error: "A batch with this name already exists.",
      });
      return;
    }

    const nextStart =
      typeof startTime === "string"
        ? startTime
        : batch.startTime;

    const nextEnd =
      typeof endTime === "string"
        ? endTime
        : batch.endTime;

    if (!durationMinutes(nextStart, nextEnd)) {
      response.status(400).json({
        error: "End time must be after start time.",
      });
      return;
    }

    if (studentIds !== undefined) {
      const requested = [...new Set(studentIds as string[])];

      const current = await Student.find({
        batchId: batch._id,
      })
        .select("_id")
        .lean();

      const currentIds = new Set(
        current.map((student) => String(student._id))
      );

      const toRemove = [...currentIds].filter(
        (studentId) => !requested.includes(studentId)
      );

      const toAdd = requested.filter(
        (studentId) => !currentIds.has(studentId)
      );

      if (toAdd.length && !batch.active) {
        response.status(409).json({
          error: "Activate this batch before assigning students.",
        });
        return;
      }

      const selected = await Student.find({
        _id: { $in: requested },
        active: true,
      })
        .select("_id batchId")
        .populate("batchId", "active");

      if (selected.length !== requested.length) {
        response.status(400).json({
          error:
            "One or more selected students are missing or inactive.",
        });
        return;
      }

      const conflict = selected.filter(
        (student) =>
          student.batchId &&
          String(
            (student.batchId as unknown as { _id: unknown })._id
          ) !== String(batch._id) &&
          (student.batchId as unknown as { active?: boolean })
            .active !== false
      );

      if (conflict.length) {
        response.status(409).json({
          error:
            "Some selected students already belong to another batch. Remove them from that batch first.",
          studentIds: conflict.map((student) =>
            String(student._id)
          ),
        });
        return;
      }

      const movedStudents: {
        id: unknown;
        previousBatchId: unknown;
      }[] = [];

      for (const student of selected.filter((item) =>
        toAdd.includes(String(item._id))
      )) {
        const oldBatchId = student.batchId
          ? (student.batchId as unknown as { _id: unknown })._id
          : null;

        const result = await Student.updateOne(
          {
            _id: student._id,
            batchId: oldBatchId,
            active: true,
          },
          {
            $set: { batchId: batch._id },
          }
        );

        if (!result.modifiedCount) {
          for (const moved of movedStudents) {
            await Student.updateOne(
              {
                _id: moved.id,
                batchId: batch._id,
              },
              {
                $set: {
                  batchId: moved.previousBatchId,
                },
              }
            );
          }

          response.status(409).json({
            error:
              "A selected student was assigned to another batch at the same time. Reload and try again.",
          });
          return;
        }

        movedStudents.push({
          id: student._id,
          previousBatchId: oldBatchId,
        });
      }

      if (toRemove.length) {
        await Student.updateMany(
          {
            _id: { $in: toRemove },
            batchId: batch._id,
          },
          {
            $set: { batchId: null },
          }
        );
      }
    }

    batch.name = nextName;
    batch.nameKey = nameKey;
    batch.startTime = nextStart;
    batch.endTime = nextEnd;

    await batch.save();

    const students = await Student.find({
      batchId: batch._id,
    })
      .select("name phone fatherName batchId active")
      .lean();

    response.json({
      batch: serialize({
        ...batch.toObject(),
        students,
      }),
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      response.status(409).json({
        error: "A batch with this name already exists.",
      });
      return;
    }

    next(error);
  }
}

// PATCH /:id/active
export async function updateBatchActiveStatus(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const id = Array.isArray(request.params.id)
      ? request.params.id[0]
      : request.params.id;

    if (!isValidObjectId(id)) {
      response.status(400).json({
        error: "Invalid batch ID.",
      });
      return;
    }

    const active = (request.body as { active?: unknown }).active;

    if (typeof active !== "boolean") {
      response.status(400).json({
        error: "active must be true or false.",
      });
      return;
    }

    const batch = await Batch.findByIdAndUpdate(
      id,
      { active },
      { new: true }
    );

    if (!batch) {
      response.status(404).json({
        error: "Batch not found.",
      });
      return;
    }

    response.json({
      batch: serialize(batch.toObject()),
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /:id
export async function deleteBatch(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const id = Array.isArray(request.params.id)
      ? request.params.id[0]
      : request.params.id;

    if (!isValidObjectId(id)) {
      response.status(400).json({
        error: "Invalid batch ID.",
      });
      return;
    }

    const batch = await Batch.findById(id);

    if (!batch) {
      response.status(404).json({
        error: "Batch not found.",
      });
      return;
    }

    const [studentCount, attendanceCount] = await Promise.all([
      Student.countDocuments({ batchId: batch._id }),
      Attendance.countDocuments({ batchId: batch._id }),
    ]);

    if (studentCount || attendanceCount) {
      response.status(409).json({
        error: `This batch has ${studentCount} assigned student(s) and ${attendanceCount} attendance record(s). Reassign students and resolve or preserve attendance history before deleting it.`,
      });
      return;
    }

    await batch.deleteOne();

    response.status(204).end();
  } catch (error) {
    next(error);
  }
}
